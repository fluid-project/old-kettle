/*
Copyright 2009-2010 University of Toronto

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://source.fluidproject.org/svn/LICENSE.txt
*/

// Declare dependencies.
/*global jQuery, fluid*/

fluid = fluid || {};
fluid.catalogueService = fluid.catalogueService || {};

(function ($) {
    
    var errorCallback = function (XMLHttpRequest, textStatus, errorThrown) {
        fluid.log("XMLHttpRequest: " + XMLHttpRequest);
        fluid.log("Status: " + textStatus);
        fluid.log("Error: " + errorThrown);
        return [500, {"Content-Type": "text/plain"}, errorThrown];
    };
    
    var ajaxCall = function (url, success, error) {
        $.ajax({
            url: url,
            dataType: "json",
            asyn: false,
            success: success,
            error: error
        });
    };
    
    var getAjax = function (url, error) {
        var data;
        var success = function (returnedData, status) {
            data = JSON.parse(returnedData.substring(0, returnedData.length - 1)); //BUG - Doesn't parse with last \n.
        };        
        ajaxCall(url, success, error);        
        return data;
    };
    
    var compileDatabaseURL = function (params, config) {
        return fluid.stringTemplate(config.viewURLTemplateWithKey, {
            dbName: params.db || "", 
            view: config.views.catalogueByTitle, 
            key: JSON.stringify({
                title: params.title,
                lang: params.lang
            })
        });
    };
    
    var compileTargetURL = function (URLBase, params) {
        return URLBase + "?" + $.param(params);
    };
    
    var compileArtifacts = function (artifacts, params) {
        var baseArtifactURL = "../artifacts/view.html";
        return fluid.transform(artifacts, function (artifact) {
            return {
                description: artifact.description,
                media: artifact.media,
                title: artifact.title,
                image: artifact.image,
                target: compileTargetURL(baseArtifactURL, {
                    db: params.db.slice(0, params.db.indexOf('_')),
                    accessNumber: artifact.accessionNumber,
                    lang: params.lang
                })
            }
        });
    };
    
    var compileTheme = function (themes, exhibitionTitle, params, baseURL) {
        baseURL = baseURL || "";
        return fluid.transform(themes, function (theme) {
            return {
                title: theme.title,
                allArtifactsViewURL: compileTargetURL(baseURL, {
                    db: params.db,
                    exhibition: exhibitionTitle,
                    title: theme.title,
                    lang: params.lang
                }),
                numArtifacts: theme.numArtifacts,
                artifacts: compileArtifacts(theme.artifacts, params)
            };
        });
    };
    
    var afterMap = function (data, params) {
        var baseCatalogueURL = "browse.html";
        
        return {
            title: data.title,
            allArtifactsViewURL: compileTargetURL(baseCatalogueURL, {
                db: params.db,
                exhibition: data.title,
                title: "viewAll",
                lang: params.lang
            }),
            numArtifacts: data.numArtifacts,
            themes: compileTheme(data.themes, data.title, params, baseCatalogueURL)
        };
    };
    
    var getData = function (errorCallback, params, config) {
        var url = compileDatabaseURL(params, config);
        var rawData = getAjax(url, errorCallback);
        var dbName = params.db + "_catalogue";
        
        return fluid.engage.mapModel(rawData.rows[0], dbName);
    };
    
    fluid.catalogueService.initCatalogueDataFeed = function (config, app) {
        var catalogueDataHandler = function (env) {
            return [200, {"Content-Type": "text/plain"}, JSON.stringify(getData(errorCallback, env.urlState.params, config))];
        };
    
        var acceptor = fluid.engage.makeAcceptorForResource("view", "json", catalogueDataHandler);
        fluid.engage.mountAcceptor(app, "catalogue", acceptor);
    };
    
    fluid.catalogueService.initCatalogueService = function (config, app) {
        var renderHandlerConfig = {
            config: config,
            app: app,
            target: "catalogue/",
            source: "components/catalogue/html/",
            sourceMountRelative: "engage",
            baseOptions: {
                renderOptions: {
                    cutpoints: [{selector: "#flc-initBlock", id: "initBlock"}]
                }
            }
        };
        var handler = fluid.engage.mountRenderHandler(renderHandlerConfig);
            
        handler.registerProducer("view", function (context, env) {
            var params = context.urlState.params;
            var data = getData(errorCallback, params, config);
            var strings = fluid.kettle.getBundle(renderHandlerConfig, params);
            var options = {
                model: afterMap(data, params)
            };
            if (strings) {
                strings.options = strings;
            }
            
            return {
                ID: "initBlock",
                functionname: "fluid.catalogue",
                "arguments": [".flc-catalogue-container", options]
            };
        });
    };    
})(jQuery);
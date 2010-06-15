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
        return fluid.kettle.couchDBViewTemplate(config.viewURLTemplateWithKey, {
            dbName: params.db, 
            view: config.views.catalogueByID, 
            key: {
                id: params.id,
                lang: params.lang
            }
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
                showBadge: artifact.media,
                title: artifact.title,
                image: artifact.image,
                target: compileTargetURL(baseArtifactURL, {
                    db: params.db.slice(0, params.db.indexOf('_')),
                    accessNumber: artifact.accessionNumber,
                    lang: params.lang
                })
            };
        });
    };
    
    var compileTheme = function (themes, exhibitionID, params, baseURL) {
        baseURL = baseURL || "";
        return fluid.transform(themes, function (theme) {
            return {
                title: theme.title,
                allArtifactsViewURL: compileTargetURL(baseURL, {
                    db: params.db,
                    exhibitID: exhibitionID,
                    sectionID: theme.sectionID,
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
                exhibitID: data.id,
                lang: params.lang
            }),
            numArtifacts: data.numArtifacts,
            themes: compileTheme(data.themes, data.id, params, baseCatalogueURL)
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
                options.strings = strings;
            }
            
            return {
                ID: "initBlock",
                functionname: "fluid.catalogue",
                "arguments": [".flc-catalogue-container", options]
            };
        });
    };    
})(jQuery);
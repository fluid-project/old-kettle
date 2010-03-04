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
"use strict";

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
            view: config.views.catalogueArtifactsByID, 
            key: {
                exhibitID: params.exhibitID,      
                sectionID: params.sectionID,
                lang: params.lang 
                }
        });
    };
    
    var getData = function (errorCallback, params, config) {
        var url = compileDatabaseURL(params, config);
        var rawData = getAjax(url, errorCallback);
        var dbName = params.db + "_catalogueArtifacts";
        var data = fluid.engage.mapModel(rawData.rows[0], dbName);
        
        var model = {
            title: data.exhibitionTitle,
            categories: [
                {
                    name: data.sectionTitle,
                    artifacts: data.sectionArtifacts
                }
            ]
        };        
        return model;
    };
    
    fluid.catalogueService.initBrowseCatalogueDataFeed = function (config, app) {
        var browseCatalogueDataHandler = function (env) {
            return [200, {"Content-Type": "text/plain"}, JSON.stringify(getData(errorCallback, env.urlState.params, config))];
        };
    
        var acceptor = fluid.engage.makeAcceptorForResource("browse", "json", browseCatalogueDataHandler);
        fluid.engage.mountAcceptor(app, "catalogue", acceptor);
    };
    
    var compileTargetURL = function (URLBase, params) {
        return URLBase + "?" + $.param(params);
    };
    
    var compileArtifacts = function (artifacts, params) {
        var baseArtifactURL = "../artifacts/view.html";
        return fluid.transform(artifacts, function (artifact) {
            return {
                title: artifact.title,
                imageUrl: artifact.imageUrl,
                media: artifact.media,
                description: artifact.description,
                url: compileTargetURL(baseArtifactURL, {
                    db: params.db.slice(0, params.db.indexOf('_')),
                    accessNumber: artifact.accessionNumber,
                    lang: params.lang
                })
            };
        });
    };
    
    var afterMap = function (data, params) {
        data.categories = $.map(data.categories, function (value) {
            return {
                name: value.name, 
                items: compileArtifacts(value.artifacts, params)
            };
        });
        return data;
    };
    
    //This should be replaced with proper message bundles when they are ready
    var addThemeTitles = function (strings, data) {
        strings.category = "Viewing %category (%size total)";
        strings.noCategory = "Viewing all objects (%size total)";
        return strings;
    };
    
    fluid.catalogueService.initBrowseCatalogueService = function (config, app) {
        var renderHandlerConfig = {
            config: config,
            app: app,
            target: "catalogue/",
            source: "components/browse/html/",
            sourceMountRelative: "engage",
            baseOptions: {
                renderOptions: {
                    cutpoints: [{selector: "#flc-initBlock", id: "initBlock"}]
                }
            }
        };
        var handler = fluid.engage.mountRenderHandler(renderHandlerConfig);
            
        handler.registerProducer("browse", function (context, env) {
            var params = context.urlState.params;
            var data = getData(errorCallback, params, config);
            
            // TODO: We're hand-altering the configuration for getBundle(), since by default it assumes that all language bundles
            // are located relative to the HTML template. In this case, however, we've got feeds using the same template but
            // applying a different set of strings to it.
            var strings = fluid.kettle.getBundle({
                config: renderHandlerConfig.config,
                source: "components/browseCatalogue/html/",
                sourceMountRelative: "engage"
            }, params) || {};
            
            var options = {
                strings: strings,
                model: afterMap(data, params),
                navigationList: {
                    options: {
                        defaultToGrid: true
                    }
                }
            };

            return {
                ID: "initBlock", 
                functionname: "fluid.browse", 
                "arguments": [".flc-browse", options]
            };
        });
            
    };    
})(jQuery);
/*
Copyright 2009 University of Cambridge
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
fluid.artifactView = fluid.artifactView || {};

(function ($) {
    
    var getData = function (modelURL) {
        var model = {};
        
        var successCallback = function (data, status) {
            model = JSON.parse(data.substring(0, data.length - 1));
            if (model.total_rows && model.total_rows > 0) {
                model = model.rows[0];
            }       
        };   
        
        $.ajax({
            url: modelURL, 
            success: successCallback,
            async: false
        });
        
        return model;
    };
    
    var buildDataURL = function (params, config) {
        return fluid.stringTemplate(config.viewURLTemplateWithKey, {
            dbName: params.db, 
            view: config.views.artifactByAccession, 
            key: JSON.stringify({
                accessNumber: params.accessNumber,
                lang: params.lang
            })
        }); 
    };

    var fetchAndNormalizeModel = function (params, config) {
        var artifactModel = fluid.engage.mapModel(getData(buildDataURL(params, config)), params.db);
        return artifactModel;
    };
    
    fluid.artifactView.initDataFeed = function (config, app) {
        var artifactDataHandler = function (env) {            
            return [200, {"Content-Type": "text/plain"}, JSON.stringify(fetchAndNormalizeModel(env.urlState.params, config))];
        };
        
        var acceptor = fluid.engage.makeAcceptorForResource("view", "json", artifactDataHandler);
        fluid.engage.mountAcceptor(app, "artifacts", acceptor);
    };
    
    var prepareArtifactViewOptions = function (data, artifactViewStrings, moreLessStrings) {
        return {
            model: data,
            descriptionMoreLess: {
                options: {
                    strings: moreLessStrings
                }
            },
            strings: artifactViewStrings
        };
    };
    
    fluid.artifactView.initMarkupFeed = function (config, app) {
        var renderHandlerConfig = {
            config: config,
            app: app,
            target: "artifacts/",
            source: "components/artifactView/html/",
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
            var data = fetchAndNormalizeModel(context.urlState.params, config);
            var artifactViewStrings = fluid.kettle.getBundle(renderHandlerConfig, params) || {};
            var moreLessStrings = fluid.kettle.getBundle({
                config: renderHandlerConfig.config,
                source: "components/moreLess/html/",
                sourceMountRelative: "engage"
            }, params) || {};
            var options = prepareArtifactViewOptions(data, artifactViewStrings, moreLessStrings);
            return {
                ID: "initBlock", 
                functionname: "fluid.engage.artifactView", 
                "arguments": [".flc-artifact", options]
            };
        });
    };
})(jQuery);

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
fluid.exhibitionService = fluid.exhibitionService || {};

(function ($) {
    
    var errorCallback = function (XMLHttpRequest, textStatus, errorThrown) {
        fluid.log("XMLHttpRequest: " + XMLHttpRequest);
        fluid.log("Status: " + textStatus);
        fluid.log("Error: " + errorThrown);
        return [500, {"Content-Type": "text/plain"}, errorThrown];
    };    
    
    var compileDatabaseURL = function (params, config) {
        return fluid.stringTemplate(config.viewURLTemplateWithKey, {
            dbName: params.db || "", 
            view: config.views.exhibitionByTitle, 
            key: JSON.stringify({
                title: params.title,
                lang: params.lang
            })
        });
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
            data = JSON.parse(returnedData.substring(0, returnedData.length - 1));
        };
        fluid.log("Beginning model fetch");      
        ajaxCall(url, success, error);
        fluid.log("End model fetch");
        return data;
    };
    
    var compileTargetURL = function (URLBase, params) {
        return URLBase + "?" + $.param(params);
    };
    
    var getData = function (errorCallback, params, config) {
        var url = compileDatabaseURL(params, config);
        var rawData = getAjax(url, errorCallback);
        var exhibitionData = fluid.engage.mapModel(rawData.rows[0], params.db + "_view");
        
        // ENGAGE-332: This is terrible! Exhibition View and About share the same Couch view and component,
        // but with very different markup and presentation. They should be separate components.
        // To work around this issue temporarily, we have to strip out catalogue information from the model.
        delete exhibitionData["cataloguePreview"];
        delete exhibitionData["catalogueSize"];
        
        return exhibitionData;
    };
    
    fluid.exhibitionService.initExhibitionAboutDataFeed = function (config, app) {
        var exhibitionAboutDataHandler = function (env) {
            return [200, {"Content-Type": "text/plain"}, JSON.stringify(getData(errorCallback, env.urlState.params, config))];
        };
    
        var acceptor = fluid.engage.makeAcceptorForResource("about", "json", exhibitionAboutDataHandler);
        fluid.engage.mountAcceptor(app, "exhibitions", acceptor);
    };
    
    fluid.exhibitionService.initExhibitionAboutService = function (config, app) {
        var renderHandlerConfig = {
            config: config,
            app: app,
            target: "exhibitions/",
            source: "components/exhibition/html/",
            sourceMountRelative: "engage",
            baseOptions: {
                renderOptions: {
                    cutpoints: [{selector: "#flc-initBlock", id: "initBlock"}]
                }
            }
        };
        var handler = fluid.engage.mountRenderHandler(renderHandlerConfig);
            
        handler.registerProducer("about", function (context, env) {
            var params = context.urlState.params;
            var strings = fluid.exhibitionService.getBundle(renderHandlerConfig, params);
            fluid.log("Decoded bundle");
            var options = {
                model: getData(errorCallback, context.urlState.params, config)
            };
            if (strings) {
                options.strings = strings;
            }
            fluid.log("Acquired model");
            return {
                ID: "initBlock",
                functionname: "fluid.engage.exhibitionView",
                "arguments": [".flc-exhibition-container", options]
            };
        });
            
    };    
})(jQuery);
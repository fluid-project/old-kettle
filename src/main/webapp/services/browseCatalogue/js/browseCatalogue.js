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
            view: config.views.catalogueArtifacts, 
            key: JSON.stringify({
                exhibitTitle: params.exhibition,
                sectionTitle: params.title
            })
        });
    };
    
    var getData = function (errorCallback, params, config) {
        var url = compileDatabaseURL(params, config);
        var rawData = getAjax(url, errorCallback);
        var dbName = params.db + "_catalogueArtifacts";
        var data = fluid.engage.mapModel(rawData.rows[0], dbName);
        
        var model = {
            categories: [
                {
                    name: data.exhibitionTitle + " / " + data.sectionTitle,
                    artifacts: data.sectionArtifacts
                }
            ]
        };        
        return JSON.stringify(model);
    };
    
    fluid.catalogueService.initBrowseCatalogueDataFeed = function (config, app) {
        var browseCatalogueDataHandler = function (env) {
            return [200, {"Content-Type": "text/plain"}, getData(errorCallback, env.urlState.params, config)];
        };
    
        var acceptor = fluid.engage.makeAcceptorForResource("browse", "json", browseCatalogueDataHandler);
        fluid.engage.mountAcceptor(app, "catalogue", acceptor);
    };
    
    fluid.catalogueService.initBrowseCatalogueService = function (config, app) {
        var handler = fluid.engage.mountRenderHandler({
            config: config,
            app: app,
            target: "catalogue/",
            source: "components/browse/html/",
            sourceMountRelative: "engage"
        });
            
        handler.registerProducer("browse", function (context, env) {
            return {};
        });
            
    };    
})(jQuery);
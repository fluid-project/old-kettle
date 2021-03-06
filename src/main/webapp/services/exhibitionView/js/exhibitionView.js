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
        return fluid.kettle.couchDBViewTemplate(config.viewURLTemplateWithKey, {
            dbName: params.db, 
            view: config.views.exhibitionByID, 
            key: {
                id: params.id,
                lang: params.lang
            }
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
        ajaxCall(url, success, error);
        return data;
    };
    
    var getData = function (errorCallback, params, config) {
        var url = compileDatabaseURL(params, config);
        var rawData = getAjax(url, errorCallback);
        var exhibitionData = fluid.engage.mapModel(rawData.rows[0], params.db + "_view");
        return exhibitionData;
    };
    
    fluid.exhibitionService.initExhibitionViewDataFeed = function (config, app) {
        var exhibitionViewDataHandler = function (env) {
            return [200, {"Content-Type": "text/plain"}, JSON.stringify(getData(errorCallback, env.urlState.params, config))];
        };
    
        var acceptor = fluid.engage.makeAcceptorForResource("view", "json", exhibitionViewDataHandler);
        fluid.engage.mountAcceptor(app, "exhibitions", acceptor);
    };
    
    
    var afterMap = function (data, params) {
        data.cataloguePreview = fluid.transform(data.cataloguePreview, function (artifact) {
            return {
                target: internalURL("../artifacts/view.html", {
                    db: params.db.slice(0, params.db.indexOf('_')),
                    accessNumber: artifact.accessionNumber,
                    lang: params.lang
                }),
                image: artifact.image,
                media: artifact.media,
                title: artifact.title
            };
        });
        return data;
    };
    
    var internalURL = function (URLBase, params, scheme) {
        return URLBase + "?" + $.param(params);
    };
    
    fluid.exhibitionService.initExhibitionViewService = function (config, app) {
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
            
        handler.registerProducer("view", function (context, env) {
            var params = context.urlState.params;
            var data = getData(errorCallback, params, config);
            var strings = fluid.kettle.getBundle(renderHandlerConfig, params);
            var guestbookVP = {db: params.db, type: "exhibition", id: data.title, lang: params.lang};
            
            var paramForURL = {
                db: params.db,
                id: data.id,
                lang: params.lang
            }; 
            
            data.catalogueLink = internalURL("../catalogue/view.html", paramForURL, "titleCentred");
            data.aboutLink = internalURL("about.html", paramForURL, "titleCentred");
            data.guestbookLink = internalURL("../guestbook/guestbook.html", guestbookVP, "guestbook");
            
            var options = {
                model: afterMap(data, params)
            };
            if (strings) {
                options.strings = strings;
            }
            var guestbookOptions = fluid.engage.guestbook.makeRemoteOptions($.extend({recent: 1, dbName: params.db}, guestbookVP));
            options.guestbook = guestbookOptions;
                
            var args = [".flc-exhibition-container", options];
            var initBlock = {ID: "initBlock", functionname: "fluid.engage.exhibitionView", 
                "arguments": args};            
            return initBlock;
        });
            
    };    
})(jQuery);
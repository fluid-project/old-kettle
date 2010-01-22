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
fluid.exhibitionService = fluid.exhibitionService || {};

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
    
    var buildCategory = function (categoryName, categoryList) {
        return {
            name: categoryName ? fluid.stringTemplate(categoryName + " (%num)", {num: categoryList.length}) : "",
            exhibitions: categoryList
        };
    };
    
    var compileDatabaseURL = function (db, config) {
        return fluid.stringTemplate(config.viewURLTemplate, 
            {dbName: db + "_exhibitions" || "", view: config.views.exhibitions});
    };
    
    var compileTargetURL = function (URLBase, params) {
        return URLBase + "?" + $.param(params);
    };
    
    var getData = function (errorCallback, db, config) {
        var url = compileDatabaseURL(db, config);
        var rawData = getAjax(url, errorCallback);
        var dbName = db + "_exhibitions";
        var baseExhibitionURL = "view.html";
        var baseUpcomingExhibitionURL = "about.html";
        var data = fluid.transform(rawData.rows, function (value) {
            return fluid.engage.mapModel(value, dbName);
        });
        
        var currentExhibitions = $.map(data, function (value) {
            return value.isCurrent === "yes" ? {
                url: compileTargetURL(baseExhibitionURL, {
                    db: dbName,
                    title: value.title
                }),
                imageUrl: value.image,
                title: value.title,
                description: value.displayDate === "Permanent exhibition" ? "Permanent" : "Through " + value.endDate
            } : null;
        });
        var upcomingExhibitions = $.map(data, function (value) {
            return value.isCurrent === "no" ? {
                url: compileTargetURL(baseUpcomingExhibitionURL, {
                    db: dbName,
                    title: value.title
                }),
                imageUrl: value.image,
                title: value.title,
                description: value.displayDate
            } : null;
        });
        var model = {
            categories: [
                buildCategory("", currentExhibitions), 
                buildCategory("Upcoming Exhibitions", upcomingExhibitions)
            ]
        };        
        return model;
    };
    
    fluid.exhibitionService.initExhibitionsDataFeed = function (config, app) {
        var exhibitionsDataHandler = function (env) {
            var data = JSON.stringify(getData(errorCallback, env.urlState.params.db, config));
            return [200, {"Content-Type": "text/plain"}, data];
        };
    
        var acceptor = fluid.engage.makeAcceptorForResource("browse", "json", exhibitionsDataHandler);
        fluid.engage.mountAcceptor(app, "exhibitions", acceptor);
    };
    
    var afterMap = function (data) {
        data.categories = $.map(data.categories, function (value) {
            return {
                name: value.name,
                items: value.exhibitions
            };
        });
        return data;
    };
        
    fluid.exhibitionService.initExhibitionsService = function (config, app) {
        var handler = fluid.engage.mountRenderHandler({
            config: config,
            app: app,
            target: "exhibitions/",
            source: "components/browse/html/",
            sourceMountRelative: "engage",
            baseOptions: {
                renderOptions: {
                    cutpoints: [{selector: "#flc-initBlock", id: "initBlock"}]
                }
            }
        });
            
        handler.registerProducer("browse", function (context, env) {
	        var data = getData(errorCallback, context.urlState.params.db, config);
            var options = {
                model: afterMap(data),
                useCabinet: true,
                // TODO: This string needs to be internationalized
                title: "Exhibitions"
            };

            return {
                ID: "initBlock", 
                functionname: "fluid.browse", 
                "arguments": [".flc-browse", options]
            };
        });
            
    };
    
})(jQuery);
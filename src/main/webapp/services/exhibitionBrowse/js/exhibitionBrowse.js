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
        
        var sortExhibitions = function (exhibitions) {
            var current = {
                isCurrent: true,
                exhibitions: []
            };
            
            var upcoming = {
                isCurrent: false,
                exhibitions: []  
            };
            
            $.each(exhibitions, function (i, exhibition) {
                var exhibitionInfo = {
                    image: exhibition.image,
                    title: exhibition.title,
                    url: compileTargetURL(exhibition.isCurrent ? baseExhibitionURL : baseUpcomingExhibitionURL, {
                        db: dbName,
                        title: exhibition.title
                    }),
                    displayDate: exhibition.displayDate,
                    endDate: exhibition.endDate
                };
                
                if (exhibition.isCurrent) {
                    current.exhibitions.push(exhibitionInfo);
                } else {
                    upcoming.exhibitions.push(exhibitionInfo);
                }
            });
            
            return [current, upcoming];
        };
        
        var model = {
            categories: sortExhibitions(data)
        };        
        return model;
    };
    
    fluid.exhibitionService.initExhibitionBrowseDataFeed = function (config, app) {
        var exhibitionsDataHandler = function (env) {
            var data = JSON.stringify(getData(errorCallback, env.urlState.params.db, config));
            return [200, {"Content-Type": "text/plain"}, data];
        };
    
        var acceptor = fluid.engage.makeAcceptorForResource("browse", "json", exhibitionsDataHandler);
        fluid.engage.mountAcceptor(app, "exhibitions", acceptor);
    };
    
    var afterMap = function (data) {
        data.categories = fluid.transform(data.categories, function (category) {
            return {
                 items: fluid.transform(category.exhibitions, function (exhibition) {
                    return {
                        isCurrent: exhibition.isCurrent,
                        url: exhibition.url,
                        imageUrl: exhibition.image,
                        title: exhibition.title,
                        description: exhibition.displayDate
                    };
                })
            };
        });
        return data;
    };
    
    fluid.exhibitionService.initExhibitionBrowseService = function (config, app) {
        var renderHandlerConfig = {
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
        };
        var handler = fluid.engage.mountRenderHandler(renderHandlerConfig);
            
        handler.registerProducer("browse", function (context, env) {
            var params = context.urlState.params;
            var data = getData(errorCallback, params.db, config);
            var strings = fluid.kettle.getBundle(renderHandlerConfig, params);
            var options = {
                model: afterMap(data),
                useCabinet: true
            };
            if (strings) {
                options.strings = strings;
            }

            return {
                ID: "initBlock", 
                functionname: "fluid.browse", 
                "arguments": [".flc-browse", options]
            };
        });
            
    };
    
})(jQuery);
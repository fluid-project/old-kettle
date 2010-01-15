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
			category: fluid.stringTemplate(categoryName + " (%num)", {num: categoryList.length}),
			listOptions: {
            	links: categoryList
            }
		};
	};
	
	var compileDatabaseURL = function (params, config) {
		return fluid.stringTemplate(config.viewURLTemplate, 
            {dbName: params.db + "_exhibitions" || "", view: config.views.exhibitions});
	};
	
	var compileTargetURL = function (URLBase, params) {
		return URLBase + "?" + $.param(params);
	};
	
	var getData = function (errorCallback, params, config) {
		var url = compileDatabaseURL(params, config);
		var rawData = getAjax(url, errorCallback);
		var dbName = params.db + "_exhibitions";
		var baseExhibitionURL = "view.html";
		var data = fluid.transform(rawData.rows, function (value) {
			return fluid.engage.mapModel(value, dbName);
		});
		var currentExhibitions = $.map(data, function (value) {
			return value.isCurrent === "yes" ? {
				target: compileTargetURL(baseExhibitionURL, {
                    db: dbName,
                    title: value.title
                }),
				image: value.image,
				title: value.title,
				description: value.displayDate === "Permanent exhibition" ? "Permanent" : "Through " + value.endDate
			} : null;
		});
		var upcomingExhibitions = $.map(data, function (value) {
			return value.isCurrent === "no" ? {
				target: compileTargetURL(baseExhibitionURL, {
                    db: dbName,
                    title: value.title
                }),
				image: value.image,
				title: value.title,
				description: value.displayDate
			} : null;
		});
		var model = {
	        strings: {
	            title: "Exhibitions"
	        },
	        useCabinet: true,
	        lists: [
	        	buildCategory("Current Exhibitions", currentExhibitions), 
	        	buildCategory("Upcoming Exhibitions", upcomingExhibitions)
	        ]
	    };		
		return JSON.stringify(model);
	};
	
	fluid.exhibitionService.initExhibitionsDataFeed = function (config, app) {
	    var exhibitionsDataHandler = function (env) {
	        return [200, {"Content-Type": "text/plain"}, getData(errorCallback, env.urlState.params, config)];
	    };
	
	    var acceptor = fluid.engage.makeAcceptorForResource("browse", "json", exhibitionsDataHandler);
	    fluid.engage.mountAcceptor(app, "exhibitions", acceptor);
	};
	
	fluid.exhibitionService.initExhibitionsService = function (config, app) {
	    var handler = fluid.engage.mountRenderHandler({
	        config: config,
	        app: app,
	        target: "exhibitions/",
	        source: "components/browse/html/",
	        sourceMountRelative: "engage"
	    });
	        
        handler.registerProducer("browse", function (context, env) {
            return {};
        });
	        
    };    
})(jQuery);
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
			key: '"' + params.title + '"'
		});
	};
	
	var compileTargetURL = function (URLBase, params) {
		return URLBase + "?" + $.param(params);
	};
	
	var buildSectionsLinks = function (sections, links, baseCatalogueURL, db, exhibition) {
		return $.each(sections, function (index, value) {
			links.push({
				target: compileTargetURL(baseCatalogueURL, {
                    db: db,
                    exhibition: exhibition,
                    title: value.sectionTitle
                }),
				image: value.sectionImage,
				title: fluid.stringTemplate(value.sectionTitle + " (%num objects)", {num: value.sectionSize}),
				description: value.sectionIntroduction
			});
		});
	};
	
	var buildSectionsList = function () {
		return {
			listOptions: {
				links: []
			}
		};
	};
	
	var getData = function (errorCallback, params, config) {
		var url = compileDatabaseURL(params, config);
		var rawData = getAjax(url, errorCallback);
		var dbName = params.db + "_catalogue";
		var catalogueData = fluid.engage.mapModel(rawData.rows[0], dbName);
		var sectionsList  = buildSectionsList();
		var baseCatalogueURL = "browse.html";
		sectionsList.listOptions.links.push({
			target: compileTargetURL(baseCatalogueURL, {
                db: params.db,
                exhibition: catalogueData.title,
                title: "viewAll"
            }),
			image: "",
			title: fluid.stringTemplate("View all (%num objects)", {num: catalogueData.viewAll})
		});
		buildSectionsLinks(catalogueData.sections, sectionsList.listOptions.links, baseCatalogueURL, params.db, catalogueData.title);
		var model = {
			strings: {
				title: catalogueData.title
			},
			lists: [
			    sectionsList
			]
		};
		return JSON.stringify({model: model});
	};
	
	fluid.catalogueService.initCatalogueDataFeed = function (config, app) {
	    var catalogueDataHandler = function (env) {
	        return [200, {"Content-Type": "text/plain"}, getData(errorCallback, env.urlState.params, config)];
	    };
	
	    var acceptor = fluid.engage.makeAcceptorForResource("view", "json", catalogueDataHandler);
	    fluid.engage.mountAcceptor(app, "catalogue", acceptor);
	};
	
	fluid.catalogueService.initCatalogueService = function (config, app) {
	    var handler = fluid.engage.mountRenderHandler({
	        config: config,
	        app: app,
	        target: "catalogue/",
	        source: "components/catalogue/html/",
	        sourceMountRelative: "engage"
	    });
	        
        handler.registerProducer("view", function (context, env) {
            return {};
        });
	        
    };    
})(jQuery);
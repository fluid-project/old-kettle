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
    
    var compileArtifacts = function (artifacts, params) {
        var baseArtifactURL = "../artifacts/view.html";
        var artifactsArray = [];
        for (var i = 0; i < artifacts.length && i < 4; i++) {
            var artifact = artifacts[i];
            artifactsArray.push({
                artifactViewURL: compileTargetURL(baseArtifactURL, {
                    db: params.db.substring(0, params.db.indexOf("_")),
                    q: artifact.accessNumber
                }),
                artifactImage: artifact.artifactImage,
                artifactTitle: artifact.artifactTitle,
                artifactDescription: artifact.artifactDescription
            });
        }
        return artifactsArray;
    };
    
    var compileTheme = function (themes, exhibitionTitle, params, baseURL) {
        baseURL = baseURL || "";
        return fluid.transform(themes, function (theme) {
            return {
                themeTitle: theme.themeTitle,
                themeArtifactsURL: compileTargetURL(baseURL, {
                    db: params.db,
                    exhibition: exhibitionTitle,
                    title: theme.themeTitle
                }),
                numberOfArtifactsInTheme: theme.numberOfArtifactsInTheme,
                artifacts: compileArtifacts(theme.artifacts, params)
            };
        });
    };
    
    var afterMap = function (data, params) {
        var baseCatalogueURL = "browse.html";
        
		return {
			exhibitionTitle: data.exhibitionTitle,
            exhibitionArtifactsURL: compileTargetURL(baseCatalogueURL, {
                db: params.db,
                exhibition: data.exhibitionTitle,
                title: "viewAll"
            }),
            numberOfArtifactsInExhibition: data.numberOfArtifactsInExhibition,
			themes: compileTheme(data.themes, data.exhibitionTitle, params, baseCatalogueURL)
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
	    var handler = fluid.engage.mountRenderHandler({
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
	    });
	        
        handler.registerProducer("view", function (context, env) {
            var params = context.urlState.params;
            var data = getData(errorCallback, params, config);
            var options = {
                model: afterMap(data, params)
            };
            
            return {
                ID: "initBlock",
                functionname: "fluid.catalogue",
                "arguments": [".flc-catalogue-container", options]
            };
        });
    };    
})(jQuery);
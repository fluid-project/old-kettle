/*
Copyright 2009 University of Toronto

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://source.fluidproject.org/svn/LICENSE.txt
*/

// Declare dependencies.
/*global jQuery, fluid*/

fluid = fluid || {};
fluid.browseDemo = fluid.browseDemo || {};

(function ($) {

	var baseArtifactURL = "view.html?";
	var queryDelim = "&";
	
	var parseEnv = function (envString, delimiter) {
	    var obj = {};
	    var ampIndex = envString.QUERY_STRING.indexOf(delimiter);
	    
	    obj.database = envString.QUERY_STRING.substring(0, ampIndex);
	    obj.query = envString.QUERY_STRING.substring(ampIndex + 1, envString.QUERY_STRING.length);
	    
	    return obj;
	};
	
	var compileDatabaseURL = function (parsedENV, config) {
	    return fluid.stringTemplate(config.queryURLTemplate, 
            {dbName: parsedENV.database || "", view: config.views.byCollectionCategory, query: parsedENV.query || ""});
	};
	
	var compileTargetURL = function (URLBase, queryDelimiter, query, database) {
	    return URLBase + (database || "") + queryDelimiter + query; 
	};
	
	var compileData = function (data, dbName) {
		var categoryText = (typeof data[0].category === "string") ? 
				data[0].category : $.makeArray(data[0].category).toString();
	    var model = {
	        strings: {
	            title: categoryText
	        },
	        useCabinet: false,
	        lists: [{
	            category: categoryText,
	            listOptions: {}
	        }]
	    };
	    
	    model.lists[0].listOptions.links = fluid.transform(data, function (artifact) {
	        return {
	            target: compileTargetURL(baseArtifactURL, queryDelim, artifact.linkTarget, dbName),
	            image: artifact.linkImage,
	            title: artifact.linkTitle,
	            description: artifact.linkDescription
	        };
	    });
	    
	    return JSON.stringify(model);
	};
	
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
	    var success = function (returnedData) {
	        data = returnedData;
	    };
	    
	    ajaxCall(url, success, error);
	    
	    return JSON.parse(data);
	};
	
	var getArtifactData = function (rawData, database) {
	    var dataRows = rawData.rows || [];
	    return fluid.transform(dataRows, function (row) {
	        var artifact = row.doc;
	        return fluid.engage.mapModel(artifact, database);
	    });
	};
	
	var getData = function (error, parsedENV, config) {
	    var url = compileDatabaseURL(parsedENV, config);
	    var rawData = getAjax(url, error);
	    
	    var dataSet = getArtifactData(rawData, parsedENV.database);
	    
	    return compileData(dataSet, parsedENV.database);
	};
	
	fluid.browseDemo.initBrowseDataFeed = function (config, app) {
	    var browseDataHandler = function (env) {
	        var parsedENV = parseEnv(env.env, queryDelim);
	        return [200, {"Content-Type": "text/plain"}, getData(errorCallback, parsedENV, config)];
	    };
	
	    var acceptor = fluid.engage.makeAcceptorForResource("browse", "json", browseDataHandler);
	    fluid.engage.mountAcceptor(app, "artifacts", acceptor);
	};
	
	
	fluid.browseDemo.initBrowseDemo = function (config, app) {
	    var handler = fluid.engage.mountRenderHandler({
	        config: config,
	        app: app,
	        target: "artifacts/",
	        source: "components/browse/html/",
	        sourceMountRelative: "engage"
	    });
	        
        handler.registerProducer("browse", function (context, env) {
            return {};
        });
	        
    };
})(jQuery);
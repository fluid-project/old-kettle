/*
Copyright 2008-2009 University of Toronto

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://source.fluidproject.org/svn/LICENSE.txt
*/

// Declare dependencies.
/*global jQuery*/

var fluid_1_2 = fluid_1_2 || {};
var fluid = fluid || fluid_1_2;

(function ($, fluid) {

fluid.browseDemo = fluid.browseDemo || {};

fluid.browseDemo.assembleData = function (env) {
    var returnValue;
    var modelSpec;
    
	var ampIndex = env.QUERY_STRING.indexOf("&");    	
	var databaseName = env.QUERY_STRING.substring(1, ampIndex);
	var queryString = env.QUERY_STRING.substring(ampIndex + 1, env.QUERY_STRING.length);
    
    var baseURL = "http://titan.atrc.utoronto.ca:5984/";
    var baseQuery = "/_fti/lucene/by_collection_category?include_docs=true&q=";
	
    var compileURL = function (baseURL, baseQuery, database, query) {
        return baseURL + database + baseQuery + query;
    };

    var parseImageURL = function (markup) {
        var start = markup.indexOf("\'", markup.indexOf("img src")) + 1;
        var end = markup.indexOf("\'", start);
        
        return markup.slice(start, end);
    };

    var replaceSpace = function (text) {
        if(typeof text !== "string") {
            text = "";
        }
        return text.replace(/\s/ig, "%20");
    };
    
    var compileData = function (data, spec) {
        var categoryText = fluid.model.getBeanValue(data.rows[0].doc, spec.category);
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
        
        model.lists[0].listOptions.links = fluid.transform(data.rows, function (artifact) {
            var base = artifact.doc;
            return {
                target: "../artifact?" + databaseName + "&" + replaceSpace(fluid.model.getBeanValue(base, spec.linkTarget)),
                image: parseImageURL(fluid.model.getBeanValue(base, spec.linkImage)),
                title: fluid.model.getBeanValue(base, spec.linkTitle),
                description: fluid.model.getBeanValue(base, spec.linkDescription)
            };
        });
        
        return JSON.stringify(model);

    };
    
    var setSpec = function (spec) {
        modelSpec = JSON.parse(spec);
    };
    
    var getModelSpec = function (database, callback) {
        var fileName = database + "DataSpec.json";
        $.ajax({
            url: "../../../../engage/components/browse/spec/" + fileName,
            dataType: "json",
            success: callback,
            async: false,
            error: function (a, b, e) {
                errorCallback("Problem Loading " + fileName + ".\nError Message: " + e);
            }
        });    
    };

    var successCallback = function (data) {
        data = JSON.parse(data);
        getModelSpec(databaseName, setSpec);
        returnValue = [200, {"Content-Type":"text/plain"}, compileData(data, modelSpec)];
    };
    
    var errorCallback = function (errorMessage) {
        returnValue = [500, {"Content-Type":"text/plain"}, errorMessage];
    };
    
    var getData = function (callback) {
        $.ajax({
            url: compileURL(baseURL, baseQuery, databaseName, queryString),
            dataType: "json",
            asyn: false,
            success: callback,
            error: function (a, b, e) {
                errorCallback("Error Message: " + e);
            }
        });
    };
    
    getData(successCallback);
    
    return returnValue;
};

fluid.browseDemo.initBrowseDemo = function(config) {
        var app = fluid.kettle.makeKettleApp(config.get("appName"));
        var baseDir = config.get("baseDir");
        
        var handler = fluid.kettle.renderHandler(
        {baseDir: baseDir + "browseDemo/",
         renderOptions: [{source: "../../../../infusion/",
                          target: "infusion"},
                         {source: "../../../../engage/",
                          target: "engage"}]});
        
        handler.registerProducer("browse", function(context, env) {
        	return {"output": "THE CATT"};
        });
        
        var rootMount = fluid.kettle.mountDirectory(baseDir, "browseDemo/");
        
        var infusionMount = fluid.kettle.mountDirectory(baseDir, "../../../infusion/");
        
        var engageClientMount = fluid.kettle.mountDirectory(baseDir, "../../../engage/");
        
        app.root["*"] = [handler, rootMount];
        app.root["infusion"] = {
        	"*": infusionMount
        };
        app.root["engage"] = {
        	"*": engageClientMount
        };
        
        return app.app;
    };
})(jQuery, fluid_1_2);
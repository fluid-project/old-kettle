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
        return text.replace(/\s/ig, "%20");
    };

    var mapData = function (data) {
        data = JSON.parse(data);
        var obj = {
            strings: {
                title: queryString
            },
            useCabinet: true,
            lists: [
                {
                    category: queryString,
                    listOptions: {}
                }
            ]
        };
        
        obj.lists[0].listOptions.links = fluid.transform(data.rows, function (object, index) {
            var title = object.doc["Object Title"];
            return {
                target: "../artifact?" + databaseName + "&" + replaceSpace(title),
                image: parseImageURL(object.doc["Media file"]),
                title: title
            };
        });
        
        return obj;
    };

    var successCallback = function (data) {
        var correctData = mapData(data);
        correctData = JSON.stringify(correctData);
        returnValue = [200, {"Content-Type":"text/plain"}, correctData];
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
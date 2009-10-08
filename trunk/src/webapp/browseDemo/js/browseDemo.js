/*
Copyright 2008-2009 University of Toronto

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://source.fluidproject.org/svn/LICENSE.txt
*/

// Declare dependencies.
/*global jQuery, fluid*/

fluid.browseDemo = fluid.browseDemo || {};

(function ($) {

var baseDataURL = "http://titan.atrc.utoronto.ca:5984/";
var baseQuery = "/_fti/lucene/by_collection_category?include_docs=true&q=";
var baseArtifactURL = "../../artifacts/view.html?";
var queryDelim = "&";

var parseEnv = function (envString, delimiter) {
    var obj = {};
    var ampIndex = envString.QUERY_STRING.indexOf(delimiter);
    
    obj.database = envString.QUERY_STRING.substring(0, ampIndex);
    obj.query = envString.QUERY_STRING.substring(ampIndex + 1, envString.QUERY_STRING.length);
    
    return obj;
};

var compileDatabaseURL = function (URLBase, queryBase, options) {
    return URLBase + (options.database || "") + queryBase + (options.query || "");
};

var compileTargetURL = function (URLBase, queryDelimiter, query, database) {
    return URLBase + (database || "") + queryDelimiter + query; 
};

var compileData = function (data, dbName) {
    var categoryText = data[0].category;
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
    returnValue = [500, {"Content-Type":"text/plain"}, errorThrown];
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
    
    ajaxCall(url, success,error);
    
    return JSON.parse(data);
};

var getArtifactData = function (rawData, database) {
    var dataRows = rawData.rows || [];
    return fluid.transform(dataRows, function (row) {
        var artifact = row.doc;
        return fluid.engage.mapModel(artifact, database);
    });
};

var getData = function (baseURL, baseQuery, error, options) {
    var url = compileDatabaseURL(baseURL, baseQuery, options);
    var rawData = getAjax(url, error);
    
    var dataSet = getArtifactData(rawData, options.database);
    
    return compileData(dataSet, options.database);
};

fluid.browseDemo.initBrowseDataFeed = function (config, app) {
    var browseDataHandler = function (env) {
        var parsedENV = parseEnv(env.env, queryDelim);
        return [200, {"Content-Type":"text/plain"}, getData(baseDataURL, baseQuery, errorCallback,parsedENV)];
    };

    var acceptor = fluid.engage.makeAcceptorForResource("browse", "json", browseDataHandler);
    fluid.engage.mountAcceptor(app, "artifacts", acceptor);
};


fluid.browseDemo.initBrowseDemo = function(config, app) {
        var baseDir = config.get("baseDir");
        
        var handler = fluid.kettle.renderHandler({
        	baseDir: baseDir + "../../../engage" + "/components/browse/html/",
        	renderOptions: {
                rebaseURLs: false,
                rewriteUrlPrefixes: [{
                    source: "../../../../infusion",
                    target: "../infusion"
                },
                {
                    source: "../../../../engage",
                    target: "../engage"
                }]
        	}
        });
        
        handler.registerProducer("browse", function(context, env) {
        	return {};
        });
        
        fluid.engage.mountAcceptor(app, "artifacts", handler);
    };
})(jQuery);

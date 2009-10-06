/*
Copyright 2008-2009 University of Cambridge
Copyright 2008-2009 University of Toronto

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://source.fluidproject.org/svn/LICENSE.txt
*/

// Declare dependencies.
/*global jQuery, fluid*/

var fluid = fluid || {};

(function ($, fluid) {
	
    fluid.artifactDemo = fluid.artifactDemo || {};
    
    fluid.artifactDemo.initArtifactDataFeed = function (config, app) {
        var artifactDataHandler = function (context, env) {	
            var buildURL = function (parts) {
                var url = "";
                for (index in parts) {
                    url += parts[index];
                }
                return url;
            };
            
            var buildDataURL = function (dbName, query) {
                return buildURL(["http://titan.atrc.utoronto.ca:5984/", dbName, 
                                 "/_fti/lucene/all?include_docs=true&q=", query]); 
            };

            var ampIndex = env.QUERY_STRING.indexOf("&");    	
            var databaseName = env.QUERY_STRING.substring(0, ampIndex);
            var artifactQuery = env.QUERY_STRING.substring(ampIndex + 1, env.QUERY_STRING.length);
            
            var model = fluid.artifact.getData(buildDataURL(databaseName, artifactQuery));
            
            model = fluid.artifact.artifactCleanUp(fluid.engage.mapModel(model, databaseName));
            
            return [200, {"Content-Type":"text/plain"}, JSON.stringify({
                model: model,
                cutpoints: fluid.artifact.buildCutpoints(),
                tree: fluid.artifact.buildComponentTree(model)
            })];
        };
        
        fluid.engage.mountHandler(app, "artifactData", artifactDataHandler);
    };
    
    fluid.artifactDemo.initArtifactDemo = function(config, app) {
        var baseDir = config.get("baseDir");
        
        var handler = fluid.kettle.renderHandler({
            baseDir: baseDir + "artifactDemo/",
            rebaseUrls: true,
            renderOptions: {
                rewriteUrlPrefixes: [{
                    source: "../../../../infusion",
                    target: "/infusion"
                },
                {
                    source: "../../../../engage",
                    target: "/engage"
                }]
            }
        });
        
        handler.registerProducer("artifact", function(context, env) {
            return {};
        });

        fluid.engage.mountAcceptor(app, "artifactView", handler);
    };
    
})(jQuery, fluid);

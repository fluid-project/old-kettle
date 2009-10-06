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
            
            var artifactCleanUp = function (data) {
        		if (data instanceof Array) {
        			for (var i = 0; i < data.length; i++) {
        				if (data[i] instanceof Array || data[i] instanceof Object) {
        					data[i] = artifactCleanUp(data[i]);
        				}
        				if (!data[i]) {
        					if (data.length < 2) {
        						return undefined;
        					}
        					else {
        						data.splice(i, 1);
        						i--;
        					}
        				}
        			}
        			if (data.length < 2) {
        				data = data[0];
        			}
        		}
        		else if (data instanceof Object) {
        			for (var key in data) {
        				if (data[key] instanceof Array || data[key] instanceof Object) {
        					data[key] = artifactCleanUp(data[key]);
        				}
        				if (!data[key]) {
        					delete data[key];
        				}
        			}
        			//	if (size(data) < 1) return undefined;
        		}
        		return data;
        	};
        	
        	var getData = function (modelURL) {
        		var model = {}
        		var successCallback = function (data, status) {
        			try {
        				data.charAt;
        				data = JSON.parse(data);
        			} catch (e) {				
        			} finally {
        				model = data;
        				if (model.total_rows && model.total_rows > 0) {
        					model = model.rows[0].doc;
        				}
        			}       
                };        
                $.ajax({
        			url: modelURL, 
        			success: successCallback,
        			dataType: "json",
        			async: false
        		});
                return model;
        	};
        	
        	var buildCutpoints = function (){
            	return [{
            	 		id: "artifactTitle",
            	 		selector: ".artifact-name"
            	 	},
            	 	{
            	 		id: "artifactImage",
            	 		selector: ".artifact-picture"
            	 	},
            	 	{
            	 		id: "artifactTitle2",
            	 		selector: ".artifact-descr-name"
            	 	},
            	 	{
            	 		id: "artifactAuthor",
            	 		selector: ".artifact-provenance"
            	 	},
            	 	{
            	 		id: "artifactDate",
            	 		selector: ".artifact-date"
            	 	},
            	 	{
            	 		id: "artifactAccessionNumber",
            	 		selector: ".artifact-accession-number"
            	 	}
            	];
            };
            
            var buildComponentTree = function (model) {
            	return {children: [
        			{
        				ID: "artifactTitle",
        				valuebinding: "artifactTitle"
        			},
        			{
        				ID: "artifactImage",
        				decorators: [{
        					attrs: {
            					src: model.artifactImage
            				}
        				}]
        			},
        			{
        				ID: "artifactTitle2",
        				valuebinding: "artifactTitle",
        				decorators: [{
            				type: "addClass",
            				classes: "fl-text-bold"
        				}]
        			},
        			{
        				ID: "artifactAuthor",
        				valuebinding: "artifactAuthor"
        			},
        			{
        				ID: "artifactDate",
        				valuebinding: "artifactDate"
        			},
        			{
        				ID: "artifactAccessionNumber",
        				valuebinding: "artifactAccessionNumber"
        			}
            	]};
            };
            
            var buildDataURL = function (dbName, query) {
                return buildURL(["http://titan.atrc.utoronto.ca:5984/", dbName, 
                                 "/_fti/lucene/all?include_docs=true&q=", query]); 
            };

            var ampIndex = env.QUERY_STRING.indexOf("&");    	
            var databaseName = env.QUERY_STRING.substring(0, ampIndex);
            var artifactQuery = env.QUERY_STRING.substring(ampIndex + 1, env.QUERY_STRING.length);
            
            var model = getData(buildDataURL(databaseName, artifactQuery));
            
            model = artifactCleanUp(fluid.engage.mapModel(model, databaseName));
            
            return [200, {"Content-Type":"text/plain"}, JSON.stringify({
            	toRender: {
                	model: model,
                	cutpoints: buildCutpoints(),
                	tree: buildComponentTree(model)
            	}
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

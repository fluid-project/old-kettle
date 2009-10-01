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
/*global jQuery*/

var fluid_1_2 = fluid_1_2 || {};
var fluid = fluid || fluid_1_2;

(function ($, fluid) {
	
    fluid.artifactDemo = fluid.artifactDemo || {};
    
    fluid.artifactDemo.couch = function(env) {
    	
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
    	var databaseName = env.QUERY_STRING.substring(1, ampIndex);
    	var artifactQuery = env.QUERY_STRING.substring(ampIndex + 1, env.QUERY_STRING.length);

		var model = fluid.artifact.getData(buildDataURL(databaseName, artifactQuery));
		
		model = JSON.parse(model);
		if (model.total_rows && model.total_rows > 0) {
			model = fluid.artifact.artifactCleanUp(fluid.engage.mapModel(model.rows[0].doc, databaseName));
		}
		else {
			return [500, {"Content-Type":"text/plain"}, "Query returned nothing."];
		}
		
		return [200, {"Content-Type":"text/plain"}, JSON.stringify({
			model: model,
            cutpoints: fluid.artifact.buildCutpoints(),
    		tree: fluid.artifact.buildComponentTree(model)
		})];
    };
    
    fluid.artifactDemo.initArtifactDemo = function(config) {
        var app = fluid.kettle.makeKettleApp(config.get("appName"));
        var baseDir = config.get("baseDir");
        
        var handler = fluid.kettle.renderHandler(
        {baseDir: baseDir + "artifactDemo/",
         renderOptions: [{source: "../../../../infusion/",
                          target: "infusion"},
                         {source: "../../../../engage/",
                          target: "engage"}]});
        
        handler.registerProducer("artifact", function(context, env) {
        	return {"output": "THE CATT"};
        });
        
        var rootMount = fluid.kettle.mountDirectory(baseDir, "artifactDemo/");
        
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
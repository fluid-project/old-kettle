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
    	
    	var ampIndex = env.QUERY_STRING.indexOf("&");    	
    	var databaseName = env.QUERY_STRING.substring(1, ampIndex);
    	var artifactQuery = env.QUERY_STRING.substring(ampIndex + 1, env.QUERY_STRING.length);
    	
    	var rootImageURLHandler = function (databaseName) {
    		switch (databaseName) {
    			case "mmi":
    				return function (imageString) {
    		    		return imageString.substring(imageString.indexOf("src='") + 5, 
    		    						imageString.indexOf(".jpg'") + 4);
    				};
    			case "mccord":
    				return function (imagefile) {
    					return imagefile[imagefile.length - 2].nodetext;
    				};
    			default:
    				break;
    		}
    	};
    	
    	var handler = fluid.artifact.handler({
    		modelURL: "http://titan.atrc.utoronto.ca:5984/" + 
    				  databaseName + 
    				  "/_fti/lucene/all?include_docs=true&q=",
    		specURL: "../../../../engage/components/artifact/spec/" + databaseName + "DataSpec.json",
    		getImageURL: rootImageURLHandler(databaseName),
			styles: {
				artNameHeadingInList: "fl-text-bold"
			}
    	});
    	
    	var wrapGetDoc = function (data, status) {
    		data = JSON.parse(data);
    		if (data.total_rows && data.total_rows > 0) {
    			handler.getDoc(data.rows[0].doc, status);
    		}
    		else {
    			return [200, {"Content-Type":"text/plain"}, "Query returned nothing."];
    		}
    	};
    	
		$.ajax({
			url: handler.options.modelURL + artifactQuery, 
			success: wrapGetDoc,
			dataType: "json"
		});
		
		handler.options.toRender = {
    		model: handler.options.model,
    		cutpoints: handler.buildCutpoints(),
    		tree: handler.buildComponentTree()
	    };
		
    	return [200, {"Content-Type":"text/plain"}, JSON.stringify(handler.options.toRender)];
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
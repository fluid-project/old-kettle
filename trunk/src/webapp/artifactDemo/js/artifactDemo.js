/*
Copyright 2008-2009 University of Cambridge
Copyright 2008-2009 University of Toronto
Copyright 2007-2009 University of California, Berkeley

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
    
    fluid.defaults("fluid.artifactDemo.couchHandler", {   
    	response: {},
		model: {},
		spec: {},
		couchURL: "localhost:5984",
		specURL: null,
		getImageURL: function(imageString) {
    		return {
    			attrs: {
    				src: imageString.substring(imageString.indexOf("src='") + 5, 
    						imageString.indexOf(".jpg'") + 4) 
    			}
    		};
		},
		styles: {
			artNameHeadingInList: "fl-text-bold"
		}
    });
    
    fluid.artifactDemo.couchHandler = function(options) {
    	
    	var that = fluid.initLittleComponent("fluid.artifactDemo.couchHandler", options);
    	
    	that.cleanUp = function (data) {
    		if (data instanceof Array) {
    			for (var i = 0; i < data.length; i++) {
    				if (data[i] instanceof Array || data[i] instanceof Object) {
    					data[i] = that.cleanUp(data[i]);
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
    					data[key] = that.cleanUp(data[key]);
    				}
    				if (!data[key]) {
    					delete data[key];
    				}
    			}
    			//	if (size(data) < 1) return undefined;
    		}
			return data;
    	};
    	
    	that.getDoc = function() {
    		return function (data, status) {
	    		data = JSON.parse(data);
	    		if (data.total_rows && data.total_rows > 0) {
	    			that.options.model = that.cleanUp(data.rows[0].doc);
	    		}
	    		else {
	    			return [200, {"Content-Type":"text/plain"}, "Query returned nothing."];
	    		}
	    		
	    		var getSpec = function() {
	    			return function (data, status) {
	    				data = JSON.parse(data);
	    				that.options.spec = data.spec;	    				
	    			};
	    		};
	    		
	    		(function (that, callback) {
	    			$.ajax({
	        			url: that.options.specURL, 
	        			success: callback,
	        			dataType: "json"
	        		});
	    		})(that, getSpec());
	    		
	    		var toRender = {
	    			tree: fluid.csRenderer.buildComponentTree(that.options),
	    			cutpoints: fluid.csRenderer.createCutpoints(that.options.spec),
	    			model: that.options.model
	    		};
	    		
	    		that.options.response = [200, {"Content-Type":"text/plain"}, JSON.stringify(toRender)];
    		};
    	};
    	return that;
    };
    
    fluid.artifactDemo.couch = function(env) {
    	
    	var ampIndex = env.QUERY_STRING.indexOf("&");    	
    	var databaseName = env.QUERY_STRING.substring(1, ampIndex);
    	var artifactQuery = env.QUERY_STRING.substring(ampIndex + 1, env.QUERY_STRING.length);
    	
    	var that = fluid.artifactDemo.couchHandler({
    		couchURL: "http://titan.atrc.utoronto.ca:5984/" + 
    				  databaseName + 
    				  "/_fti/lucene/all?include_docs=true&q=",
    		specURL: "../artifactDemo/" + databaseName + ".json"
    	});
    	
    	(function (that, callback) {
    		$.ajax({
    			url: that.options.couchURL + artifactQuery, 
    			success: callback,
    			dataType: "json"
    		});
    	})(that, that.getDoc());
    	
    	return that.options.response;
    };
    
    fluid.artifactDemo.initArtifactDemo = function(config) {
        var app = fluid.kettle.makeKettleApp(config.get("appName"));
        var baseDir = config.get("baseDir");
        
        var handler = fluid.kettle.renderHandler(
        {baseDir: baseDir + "artifactDemo/",
         renderOptions: [{source: "../../../../../../fluid/infusion/trunk/src/webapp/",
                          target: "fluid-infusion"},
                         {source: "../../../../../engage-client/trunk/components/",
                          target: "engage-client"}]});
        
        handler.registerProducer("artifact", function(context, env) {
        	return {"output": "THE CATT"};
        });
        
        var rootMount = fluid.kettle.mountDirectory(baseDir, "artifactDemo/");
        
        var infusionMount = fluid.kettle.mountDirectory(baseDir, "../../../../../fluid/infusion/trunk/src/webapp/");
        
        var engageClientMount = fluid.kettle.mountDirectory(baseDir, "../../../../engage-client/trunk/components/");
        
        app.root["*"] = [handler, rootMount];
        app.root["fluid-infusion"] = {
        	"*": infusionMount
        };
        app.root["engage-client"] = {
        	"*": engageClientMount
        };
        
        return app.app;
    };
    
})(jQuery, fluid_1_2);
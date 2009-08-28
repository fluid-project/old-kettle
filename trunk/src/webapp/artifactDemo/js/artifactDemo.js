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
    
    fluid.artifactDemo.couch = function(env) {
    	
    	var response = {};
    	
    	var url = "http://titan.atrc.utoronto.ca:5984/mccord/_fti/lucene/all?include_docs=true&q=" + 
    				env["QUERY_STRING"].replace('?', '');
    	
    	var getDoc = function(data, status) {
    		data = JSON.parse(data);
    		if (data.total_rows && data.total_rows > 0) {
    			response = [200, {"Content-Type":"text/plain"}, JSON.stringify(data.rows[0].doc)];
    		}
    	};
    	
    	$.ajax({
			url: url, 
			success: getDoc,
			dataType: "json"
		});
    	
    	return response;
    };
    
    fluid.artifactDemo.initArtifactDemo = function(config) {
        var app = fluid.kettle.makeKettleApp(config.get("appName"));
        var baseDir = config.get("baseDir");
        
        var handler = fluid.kettle.renderHandler(
        {baseDir: baseDir + "artifactDemo/",
         renderOptions: [{source: "../../../../../../fluid/infusion/trunk/src/webapp/",
                          target: "fluid-infusion"},
                          {source: "../../../../../engage-client/trunk/components/artifact/",
                           target: "fluid-infusion"}]});
        
        handler.registerProducer("artifact", function(context, env) {
        	return {"output": "THE CATT"}
        });
        
        var rootMount = fluid.kettle.mountDirectory(baseDir, "artifactDemo/");
        
        var infusionMount = fluid.kettle.mountDirectory(baseDir, "../../../../../fluid/infusion/trunk/src/webapp/");
        
        var engageClientMount = fluid.kettle.mountDirectory(baseDir, "../../../../engage-client/trunk/components/artifact/");
        
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
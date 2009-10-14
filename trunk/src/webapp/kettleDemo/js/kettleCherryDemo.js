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

fluid = fluid || {};

(function ($, fluid) {
    fluid.kettleDemo = fluid.kettleDemo || {};
    
    fluid.kettleDemo.initCherryDemo = function (config) {
        var app = fluid.kettle.makeKettleApp(config.get("appName"));
        var baseDir = config.get("baseDir");
        
        var handler = fluid.kettle.renderHandler({
            baseDir: baseDir + "kettleDemo/",
            renderOptions: {
                rebaseURLs: false,
                rewriteUrlPrefixes: [{
                    source: "../../../../fluid-infusion/src/webapp",
                    target: "infusion"
                }]
            }
        });
        
        handler.registerProducer("kettle", function (context, env) {
            return {"output": "THE CATT"};
        });
        
        var rootMount = fluid.kettle.mountDirectory(baseDir, "kettleDemo/");
        
        var infusionMount = fluid.kettle.mountDirectory(baseDir, "../../../infusion/src/webapp/");
        
        app.root["*"] = [handler, rootMount];
        app.root.infusion = {
            "*": infusionMount
        };
        
        return app.app;
    };
    
})(jQuery, fluid);
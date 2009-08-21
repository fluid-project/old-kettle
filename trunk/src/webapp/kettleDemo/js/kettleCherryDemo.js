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
    fluid.kettleDemo = fluid.kettleDemo || {};
    
    fluid.kettleDemo.initCherryDemo = function(config) {
        var app = fluid.kettle.makeKettleApp(config.get("appName"));
        var baseDir = config.get("baseDir");
        
        var handler = fluid.kettle.renderHandler(
        {baseDir: baseDir + "kettleDemo/",
         renderOptions: [{source: "../../../../fluid-infusion/src/webapp",
                          target: "fluid-infusion"}]});
        
        handler.registerProducer("kettle", function(context, env) {
          return {"output": "THE CATT"}
        })
        
        var rootMount = fluid.kettle.mountDirectory(baseDir, "kettleDemo/");
        
        var infusionMount = fluid.kettle.mountDirectory(baseDir, "../../../fluid-infusion/src/webapp/");
        
        app.root["*"] = [handler, rootMount];
        app.root["fluid-infusion"] = {
          "*": infusionMount
        };
        
        return app.app;
    }
    
})(jQuery, fluid_1_2);
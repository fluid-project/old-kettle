/*
Copyright 2009 University of Cambridge
Copyright 2009 University of Toronto

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

    fluid.kettleDemo.initCherryDemo = function (config, app) {
        var handler = fluid.engage.mountRenderHandler({
            config: config,
            app: app,
            target: "kettleDemo/",
            source: "html/",
            sourceMountRelative: "kettleDemo"
        });
        
        handler.registerProducer("kettle", function (context, env) {
            return {
                "output": "The CATTT"
            };
        });
    };
    
    fluid.defaults("fluid.kettleDemo.cherryDemo", {
         gradeNames: ["fluid.kettle.app", "autoInit"],
         components: {
             renderHandler: {
                 type: "fluid.kettle.renderHandler",
                 options: {
                     urlPrefix: "kettleDemo/",
                     templateSource: "html/",
                     templateMountRelative: "kettleDemo"
                 },
                 components: {
                     kettle: {
                         type: "fluid.kettle.renderer",
                         options: {
                             path: "kettle",
                             // templatePath, if different
                             protoTree:  {
                                "output": "The CATTT"
                             }
                         }
                     }
                 }
             }  
         }
    });
    
    // TODO: We actually DO need to support multi-resolution of demands blocks!!
    
})(jQuery, fluid);

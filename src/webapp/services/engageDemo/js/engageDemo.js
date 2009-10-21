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
fluid.engageDemo = fluid.engageDemo || {};

(function ($) {
    
    fluid.engageDemo.initEngageDemo = function (config, app) {
        var handler = fluid.engage.mountRenderHandler({
            config: config,
            app: app,
            target: "demo/",
            source: "html/",
            sourceMountRelative: "engageDemo"
        });
        
        handler.registerProducer("index", function (context, env) {
            return {};
        });


    };
    
})(jQuery);
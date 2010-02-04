/*
Copyright 2010 University of Toronto

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://source.fluidproject.org/svn/LICENSE.txt
*/

// Declare dependencies.
/*global jQuery, fluid*/
"use strict";

fluid = fluid || {};
fluid.engage = fluid.engage || {};

(function ($) {
    
    fluid.engage.initHomeService = function (config, app) {
        var renderHandlerConfig = {
            config: config,
            app: app,
            target: "home/",
            source: "components/home/html/",
            sourceMountRelative: "engage",
            baseOptions: {
                renderOptions: {
                    cutpoints: [{selector: "#flc-initBlock", id: "initBlock"}]
                }
            }
        };
        
        var handler = fluid.engage.mountRenderHandler(renderHandlerConfig);
        
        handler.registerProducer("home", function (context, env) {
	        var params = context.urlState.params;
            var strings = fluid.kettle.getBundle(renderHandlerConfig, params);
            var args = [".flc-engage-homeAndLanguage", strings ? {strings: strings} : {}];
            var initBlock = {ID: "initBlock", functionname: "fluid.engage.home", 
                "arguments": args};
                        
            return initBlock;
        });
    };
    
})(jQuery);

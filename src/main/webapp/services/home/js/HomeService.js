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
        var handler = fluid.engage.mountRenderHandler({
            config: config,
            app: app,
            target: "home/",
            source: "components/home/html/",
            sourceMountRelative: "engage"
        });
        
        handler.registerProducer("home", function (context, env) {
            return {};
        });
    };
    
})(jQuery);

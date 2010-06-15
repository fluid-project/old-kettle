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
fluid.engage.home = fluid.engage.home || {};

(function ($) {
    
    fluid.engage.home.renderHandlerConfig = {
            target: "app/",
            source: "components/home/html/",
            sourceMountRelative: "engage",
            baseOptions: {
                renderOptions: {
                    cutpoints: [{selector: "#flc-initBlock", id: "initBlock"}]
                }
            }
    };
    
    fluid.kettle.markupSpout({
        renderHandlerConfig: fluid.engage.home.renderHandlerConfig,
        producers: {
          "home": function(context) {
          var params = context.urlState.params;
            var strings = fluid.kettle.getBundle(fluid.engage.home.renderHandlerConfig, params);
            var options = {};
            if (strings) {
                options.strings = strings;
            }
            var args = [".flc-homeAndLanguage", options];
            var initBlock = {
                ID: "initBlock", 
                functionname: "fluid.engage.home", 
                "arguments": args
            };
                        
            return {tree: initBlock};
            }
        }
    });
    
})(jQuery);

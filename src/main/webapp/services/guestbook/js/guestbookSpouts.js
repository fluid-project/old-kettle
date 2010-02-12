/*
Copyright 2009-2010 University of Toronto

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

(function ($) {
  
    fluid.engage.guestbook = fluid.engage.guestbook || {};
  
    fluid.engage.guestbook.mapper = function(model, directModel) {
        var comments = model.comments;
        var recent = directModel.recent;
        if (!recent || recent > comments.length) {
            return model;
        }
        else {
            comments.splice(recent, comments.length - recent);
        }
        return model;
    };
  
    fluid.engage.guestbook.demoDataSource = function() {
        return {
            get: function(directModel) {
                var demoPath = fluid.kettle.expandMountRelative("$engage/components/guestbook/data/demoData.json");
                // NB: Final version needs to source userid as well as correctly target comments onto artefact
                var data = fluid.kettle.operateUrl(demoPath, fluid.kettle.JSONParser);
                return data;          
            },
            put: function(model, directModel) {
                fluid.log("Received request to write " + JSON.stringify(model) + " at " + JSON.stringify(directModel));
            }
        };
    };
    
    fluid.engage.guestbook.dataSource = fluid.kettle.dataSource({
        source: {
            type: "fluid.engage.guestbook.demoDataSource"
        },
        outputMapper: "fluid.engage.guestbook.mapper"
    });
    
        
    fluid.kettle.dataSpout({
        url: "guestbook/comments",
        contentType: "JSON",
        source: {name: "fluid.engage.guestbook.dataSource",
            args: [{recent: "{params}.recent"}]
        }
    });
    
    fluid.engage.guestbook.renderHandlerConfig = {
            target: "guestbook/",
            source: "components/guestbook/html/",
            sourceMountRelative: "engage",
            baseOptions: {
                renderOptions: {
                    cutpoints: [{selector: "#flc-initBlock", id: "initBlock"}]
                }
            }
        };
    fluid.engage.guestbook.makeOptions = function(directModel) {
         var data = fluid.engage.guestbook.dataSource.get(directModel);
         var strings = fluid.kettle.getBundle(fluid.engage.guestbook.renderHandlerConfig, directModel);
         if (!data.isError) {
             var options = {
                 model: data.data
                 };
             if (strings) {
                options.strings = strings;
             }
             return options;
         }
         else {
             return {
                 // TODO: somehow render the guestbook in an error or blank status (disabled?)
             };
         }
    };
    
    /** Construct a set of options suitable for embedding a guestbook in a foreign
     * component, given "directModel" */
     
    fluid.engage.guestbook.makeRemoteOptions = function(directModel) {
        var baseOptions = fluid.engage.guestbook.makeOptions(directModel);
        var templateUrl = fluid.kettle.expandMountRelative("$engage/components/guestbook/html/guestbook.html");
        var templateSource = fluid.kettle.fetchTemplateSection(templateUrl);
        baseOptions.templateSource = templateSource.isError? "" : templateSource.data;
        return {options: baseOptions};
    };
        
    fluid.kettle.markupSpout({
        renderHandlerConfig: fluid.engage.guestbook.renderHandlerConfig,
        producers: {
            "guestbook": function (context) {
                var params = context.urlState.params;
                var options = fluid.engage.guestbook.makeOptions({recent: params.recent, type: params.type, id: params.id});
                if (!options.isError) {
                    return {tree: {
                        ID: "initBlock", 
                        functionname: "fluid.engage.guestbook", 
                        "arguments": [".flc-guestbook-container", options]
                    }};
                }
                return options;
            }
        }
    });
})(jQuery);
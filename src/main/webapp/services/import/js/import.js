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
fluid.engage = fluid.engage || {};

(function ($) {
    fluid.setLogging(true);
    
    fluid.kettle.markupSpout({
        renderHandlerConfig: {
            target: "import/",
            source: "components/import/html/",
            sourceMountRelative: "engage",
        },
        producers: {
            "import": function(context, renderHandlerConfig) {
                return {tree: {}};
               }
        }
    });
    
    fluid.engage.importDataSource = fluid.kettle.dataSource({
        source: {
            writeable: true,
            type: "fluid.kettle.couchDBSource",
            urlBuilder: {
                funcName: "fluid.stringTemplate",
                args: ["{config}.viewURLTemplate", 
                {
                    dbName: "${db}",
                    view: "{config}.views.exhibitions"
                }]
            }
        },
        outputMapper: "fluid.engage.importLogger"
    });
    
    fluid.kettle.dataSpout({
        url: "import/import",
        contentType: "JSON",
        source: {name: "fluid.engage.importDataSource",
            args: [{db: "{params}.db"}]
        }
    });
    
    fluid.engage.importLogger = function(data) {
        fluid.log("Received POST request, returning data " + JSON.stringify(data));
        return data;  
    };

    
})(jQuery);
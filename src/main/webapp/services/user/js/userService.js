/*
Copyright 2009 University of Toronto

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
    
    fluid.engage.idURLBuilder = function (urlTemplate, data) {
        data.id = data.id === "NEW_DOC" ? "" : data.id;
        return fluid.stringTemplate(urlTemplate, data);
    };
    
    fluid.engage.userDataSource = fluid.kettle.dataSource({
        source: {
            type: "fluid.kettle.couchDBSource",
            writeable: true,
            urlBuilder: {
                funcName: "fluid.engage.idURLBuilder",
                args: ["{config}.querySingleDocumentURLTemplate", {
                    dbName: "users",
                    id: "${id}"
                }]
            }
        }
    });
    
    fluid.kettle.dataSpout({
        url: "users/users",
        contentType: "JSON",
        source: {
            name: "fluid.engage.userDataSource",
            args: [{
                id: "{params}.id"
            }]
        }
    });
    
})(jQuery);

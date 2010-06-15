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
fluid.engage.myCollection = fluid.engage.myCollection || {};

(function ($) {

    var submitMyCollection = function (params, config) {
        var response;
        $.ajax({
            url: config.sendMyCollectionURL,
            data: params,
            type: "GET",
            dataType: "text",
            success: function (data) {
                response = data;
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                response = null;
            }            
        });
        return response;
    };
    
    fluid.engage.myCollection.initSendCollectionFeed  = function (config, app) {
        var submitMyCollectionDataHandler = function (env) {       
            var mccordResponse = submitMyCollection(env.urlState.params, config);
            
            if (!mccordResponse) {
                return [500, {"Content-Type": "text/plain"}, "An error occurred while sending your My Collection to McCord."];
            } else {
                return [200, {"Content-Type": "text/plain"}, JSON.stringify(mccordResponse)];
            }
        };
        
        var acceptor = fluid.engage.makeAcceptorForResource("sendEmail", "json", submitMyCollectionDataHandler);
        fluid.engage.mountAcceptor(app, "myCollection", acceptor);
    };

})(jQuery);

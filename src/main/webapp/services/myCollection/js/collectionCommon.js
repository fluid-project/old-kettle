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
fluid.myCollection.common = fluid.myCollection.common || {};

(function ($) {
    /**
     * Error callback function - logs errors.
     * 
     * @param {Object} XMLHttpRequest, the object used to do network operations.
     * @param textStatus, a textual representation of the error status.
     * @param errorThrown, the error thrown.
     */
    var errorCallback = function (XMLHttpRequest, textStatus, errorThrown) {
        fluid.log("Status: " + textStatus);
        fluid.log("Error: " + errorThrown);
    };

    /**
     * Creates an URL referring to a single user document in CouchDB.
     * 
     * @param id, the unique user ID.
     * @param {Object} config, the JSON config file for Engage.
     */
    fluid.myCollection.common.compileUserDocumentUrl = function (id, config) {
        return fluid.stringTemplate(config.querySingleDocumentURLTemplate, 
            {dbName: "users", id: id ? id : ""});
    };

    /**
     * Invokes jQuery $.ajax function.
     * 
     * @param url, the url to call
     * @param success, the success callback
     * @param data, the data passed to the server.
     * @param type, the HTTP method - GET or PUT.
     */
    fluid.myCollection.common.ajaxCall = function (url, success, data, type) {
        $.ajax({
            url: url,
            async: false,
            success: success,
            error: errorCallback,
            data: data,
            type: type,
            contentType: "application/json",
            processData: false
        });
    };
    
    /**
     * Returns the JSON object returned by CouchDB for a user collection.
     * 
     * @param {Object} uuid, the uuid for the collection.
     * @param {Object} config, the JSON config file for Engage. 
     */
    fluid.myCollection.common.getCollection = function (uuid, config) {
        var databaseUrl = fluid.myCollection.common.compileUserDocumentUrl(uuid, config);
        
        var data;
        
        var success = function (returnedData) {
            data = returnedData.replace("\n", "");
        };
        
        fluid.myCollection.common.ajaxCall(databaseUrl, success, "", "GET");        
        
        if (data) {
            return JSON.parse(data);
        }
    };
})(jQuery);
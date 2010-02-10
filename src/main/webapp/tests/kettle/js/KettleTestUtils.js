
/*
Copyright 2008-2010 University of Cambridge
Copyright 2008-2010 University of Toronto

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://source.fluidproject.org/svn/LICENSE.txt
*/

/*global jQuery*/
/*global fluid*/
/*global jqUnit*/


/** This file contains utilities and overrides helpful for writing tests of Kettle
 * apps and infrastructure which run from within the browser.
 */

(function ($) {


    fluid.setLogging(true);
    
    // This code goes in FluidIoC.js once it is merged in
    var singleThreadLocal = {};
    
    fluid.singleThreadLocal = function() {
        return singleThreadLocal;
    };
    
    fluid.threadLocal = fluid.singleThreadLocal;
    
    // End FluidIoC material
    if (fluid.engage) {
        fluid.engage.endeaden = fluid.identity;
    }
   
    
    fluid.kettle.testUtils = fluid.kettle.testUtils || {};
    fluid.kettle.testUtils.createMockEnv = function(method, url) {
        var togo = {};
        var path = url;
        var query;
        var qpos = url.indexOf("?");
        if (qpos !== -1) {
            path = url.substring(0, qpos);
            query = url.substring(qpos + 1);
        }
        togo.REQUEST_METHOD = method;
        togo.SCRIPT_NAME = path;
        togo.PATH_INFO = "/mount-point/" + path;

        if (query) {
            togo.QUERY_STRING = query;
        }
        return togo;
    };
    
    fluid.kettle.testUtils.makeRequest = function(app, method, url) {
        var env = fluid.kettle.testUtils.createMockEnv(method, url);
        return app(env);
    };
    
    fluid.kettle.testUtils.determineBaseDir = function() {
        var location = window.location.href.toString();
        var fpos = location.indexOf("//");
        var lpos = location.lastIndexOf("/");
        return location.substring(fpos + 2, lpos + 1) + "../../../";
    };
    
        
})(jQuery);
    

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
    
    // End FluidIoC material
    if (fluid.engage) {
        fluid.engage.endeaden = fluid.identity;
    }
   
    
    fluid.kettle.testUtils = fluid.kettle.testUtils || {};
    
    fluid.kettle.testUtils.determineBaseDir = function() {
        var location = window.location.href.toString();
        var fpos = location.indexOf("//");
        var lpos = location.lastIndexOf("/");
        return location.substring(fpos + 2, lpos + 1) + "../../../";
    };
    
        
})(jQuery);
    
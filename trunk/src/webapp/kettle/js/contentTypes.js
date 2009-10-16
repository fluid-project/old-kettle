/*
Copyright 2009 University of Cambridge

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://source.fluidproject.org/svn/LICENSE.txt
*/

/*global jQuery, fluid*/

var fluid = fluid || {};

(function ($, fluid) {
    fluid.kettle = fluid.kettle || {};
    // taken from ContentTypeInfoRegistry
    fluid.kettle.contentTypeRegistry = {
        "HTML": {
            extension: "html",  
            doctype: "<!DOCTYPE html      "
        + "PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\""
        + " \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">",
            contentTypeHeader: "text/html; charset=UTF-8"
        },
        "HTML_FRAGMENT": {
            extension: "html",  
            doctype: "",
            contentTypeHeader: "text/html; charset=UTF-8"
        },
        "XML": {
            extension:  "xml", 
            doctype: "",
            contentTypeHeader: "application/xml; charset=UTF-8"
        },
        "JSON": {
            extension: "json",  
            doctype: "",
            contentTypeHeader: "application/json; charset=UTF-8"
        },
        "XUL": {
            extension: "xul", 
            doctype: "",
            contentTypeHeader: "application/vnd.mozilla.xul+xml; charset=UTF-8"
        },
        "RSS_0_91": {
            extension: "rss",  
            doctype:
        "<!DOCTYPE rss PUBLIC \"-//Netscape Communications//DTD RSS 0.91//EN\"" +
        "\"http://my.netscape.com/publish/formats/rss-0.91.dtd\">",
            contentTypeHeader: "application/rss+xml; charset=UTF-8"
        },
        "RSS_2": {
            extension: "rss", 
            doctype: "",
            contentTypeHeader: "application/rss+xml; charset=UTF-8"
        },
        "SVG": {
            extension: "svg", 
            doctype: "",
            contentTypeHeader: "image/svg+xml; charset=UTF-8"
        },
        // This non-standard value is most commonly used:
        // http://www.bluehostforum.com/showthread.php?t=15913
        "JS": {
            extension: "js", 
            doctype: "",
            contentTypeHeader: "application/x-javascript; charset=UTF-8"
        },
        "CSS": {
            extension: "css", 
            doctype: "",
            contentTypeHeader: "text/css; charset=UTF-8"
        }
    };
})(jQuery, fluid);
  
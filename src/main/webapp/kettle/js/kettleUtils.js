/*
Copyright 2008-2009 University of Cambridge

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://source.fluidproject.org/svn/LICENSE.txt
*/

/*global jQuery, fluid, java*/

fluid = fluid || {};

(function ($, fluid) {
    fluid.kettle = fluid.kettle || {};
    
    fluid.kettle.parseUrlState = function (env) {
        var togo = fluid.kettle.parsePathInfo(env.SCRIPT_NAME);
        togo.params = fluid.kettle.paramsToMap(env.QUERY_STRING);
        return togo;
    };
    
        
    /** Canonicalise IN PLACE the supplied segment array derived from parsing a
     * pathInfo structure. Warning, this destructively modifies the argument.
     */
    fluid.kettle.cononocolosePath = function(pathInfo) {
        var consume = 0;
        for (var i = 0; i < pathInfo.length; ++ i) {
           if (pathInfo[i] === "..") {
               ++consume;
           }
           else if (consume !== 0) {
               pathInfo.splice(i - consume*2, consume*2);
               i -= consume * 2;
               consume = 0;
           }
        }
        return pathInfo;
    };
    
    fluid.kettle.makeCanon = function(compound) {
        var parsed = fluid.kettle.parsePathInfo(compound);
        fluid.kettle.cononocolosePath(parsed.pathInfo);
        return fluid.kettle.makeRelPath(parsed); 
    }
       
    fluid.kettle.generateDepth = function(depth) {
        return fluid.generate(depth, "../").join("");
    };
    
    fluid.kettle.slashiseUrl = function(url) {
        return url.replace(/\\/g, "/");
    }
          
    fluid.kettle.pathToFileURL = function (path) {
        return "file://" + (path.charAt(0) === '/' ? "" : "/") + path;
    };
    
    fluid.kettle.headerFromEntry = function (entry) {
        return {"Content-type": entry.contentTypeHeader};
    };
    
    fluid.kettle.plainHeader = fluid.kettle.headerFromEntry(fluid.kettle.contentTypeRegistry.TXT); 
    
    fluid.kettle.contentTypeFromExtension = function (extension) {
        var reg = fluid.kettle.contentTypeRegistry;
        for (var type in reg) {
            var el = reg[type];
            if (el.extension === extension) {
                return fluid.kettle.headerFromEntry(el);
            }
        }
        return {};
    };
  
})(jQuery, fluid);
    
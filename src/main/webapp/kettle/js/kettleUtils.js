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
    
    /** Three utilities that might well go into the framework **/

    /** Version of jQuery.makeArray that handles the case where the argument is undefined **/
    
    fluid.makeArray = function (array) {
        return $.makeArray(array === undefined ? null: array);
    };
    
    fluid.generate = function (n, generator) {
        var togo = [];
        for (var i = 0; i < n; ++ i) {
            togo[i] = typeof(generator) === "function" ?
                generator.call(null, i) : generator;
        }
        return togo;       
    };
    
    fluid.identity = function() {
        if (arguments.length < 2) {
            return arguments[0];
        }
        else return $.makeArray(arguments);
    }
  
    // From URLUtil.java
    function push(hash, key, value) {
        var exist = hash[key];
        if (!exist) {
            hash[key] = value;
        }
        else if (typeof(exist) === "string") {
            hash[key] = [exist, value];
        }
        else if (typeof(exist).length === "number") {
            exist[exist.length] = value;
        }
    }
    
    fluid.kettle.paramsToMap = function (queryString) {
        var togo = {};
        queryString = queryString || "";
        var segs = queryString.split("&");
        for (var i = 0; i < segs.length; ++ i) {
            var seg = segs[i];
            var eqpos = seg.indexOf("=");
            var key = seg.substring(0, eqpos);
            var value = seg.substring(eqpos + 1);
            push(togo, key, value);
        }
        return togo;
    };
    
    fluid.kettle.parsePathInfo = function (pathInfo) {
        var togo = {};
        var segs = pathInfo.split("/");
        if (segs.length > 0) {
            if (!segs[0]) {
                segs = segs.slice(1);
            }
            var top = segs.length - 1;
            var dotpos = segs[top].indexOf(".");
            if (dotpos !== -1) {
                togo.extension = segs[top].substring(dotpos + 1);
                segs[top] = segs[top].substring(0, dotpos);
            }
        }
        togo.pathInfo = segs;
        return togo;
    };
        
    
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
    
    /** Collapse the array of segments into a URL path, starting at the specified
     * segment index - this will not terminate with a slash, unless the final segment
     * is the empty string
     */
    fluid.kettle.collapseSegs = function(segs, from) {
        var togo = "";
        if (from === undefined) { 
            from = 0;
        }
        for (var i = from; i < segs.length - 1; ++ i) {
            togo += segs[i] + "/";
        }
        togo += segs[segs.length - 1];
        return togo;   
    };

    fluid.kettle.makeRelPath = function(parsed, index) {
        var togo = fluid.kettle.collapseSegs(parsed.pathInfo, index);
        if (parsed.extension) {
            togo += "." + parsed.extension;
        }
        return togo;
    };
        
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
    
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
    
    fluid.kettle.computeAbsMounts = function(mounts, baseDir) {
        fluid.transform(mounts, function(mount) {
            var absMount = baseDir + mount.source;
            mount.absSource = fluid.kettle.makeCanon(absMount);
        });
    };
    
    fluid.kettle.makeUrlRewriter = function (absMounts, renderHandlerConfig) {
        var rhc = renderHandlerConfig;
        var self = absMounts[rhc.sourceMountRelative].absSource + rhc.source;
        var targetDepth = fluid.kettle.parsePathInfo(rhc.target).pathInfo.length;
        var targetPrefix = fluid.kettle.generateDepth(targetDepth - 1);
        return function(url) {
            var canon = fluid.kettle.makeCanon(self + url);
            for (var key in absMounts) {
                var mount = absMounts[key];
                var source = mount.absSource;
                if (canon.indexOf(source) === 0) {
                    var togo = targetPrefix + mount.target + canon.substring(source.length);
                    fluid.log("Rewriting url " + url + " to " + togo)
                    return togo;
                }
            }
            fluid.log("url " + url + " failed to match any mount point");
            return null;
        };
    };
    
    fluid.kettle.countDepth = function(pathInfo) {
        var depth = 0;
        for (var i = 0; i < pathInfo.length; ++ i) {
            if (pathInfo[i] === "..") {
                ++depth;
            }
            else {
                break;
            }
        }
        return depth;
    };
    
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

    function routeSegment(segment, root, parsed, index) {
        if (!segment) {
            segment = "/";
        }
        var exist = root[segment];
        if (exist) {
            return {route: exist};
        }
        var relPath = fluid.kettle.makeRelPath(parsed, index);
        var defs = fluid.makeArray(root["*"]);
        for (var i = 0; i < defs.length; ++ i) {
            var rule = defs[i];
            var accept = rule.accept(segment, relPath, parsed);
            if (accept) {
                return accept;
            }  
        }
    }

    /** Two utilities that might well go into the framework **/

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
    
    fluid.defaults("fluid.kettle.renderHandler", {   
            templateExtension: "html",
            // TODO: allow to vary over the app
            contentType: fluid.kettle.contentTypeRegistry.HTML,
            renderOptions: {
                rebaseURLs: true,
                serialDecorators: true
            }
        }
    );
    
    fluid.kettle.mountDirectory = function (baseDir, relDirPath) {
        if (relDirPath === ".") {
            relDirPath = "";
        }
        var absBase = baseDir + relDirPath;
        return {
            accept: function (segment, relPath, pathInfo) {
                var absPath = absBase + relPath;
                var file = new java.io.File(absPath);
                var exists = file.exists();
                fluid.log("File " + absPath + " exists: " + exists);
                return exists ? {
                        handle: function (context, env) {
                            return [200, fluid.kettle.contentTypeFromExtension(pathInfo.extension), file];
                        }
                    } : null;
            }
        };
    };
    
    fluid.kettle.loadTemplate = function (href, options) {
        
        var resourceSpecs = {base: {
                href: href, 
                cutpoints: options.cutpoints
            }
        };
        fluid.fetchResources(resourceSpecs, function () {}); // synchronous server I/O
        
        var togo = {resourceSpecs: resourceSpecs};
        if (!resourceSpecs.base.fetchError) {
            togo.templates = fluid.parseTemplates(resourceSpecs, ["base"], options);
        }
        else {
            togo.fetchError = resourceSpecs.base.fetchError;
            togo.fetchError.href = href;
        }
        return togo;
    };
    
    fluid.kettle.pathToFileURL = function (path) {
        return "file://" + (path.charAt(0) === '/' ? "" : "/") + path;
    };
    
    fluid.kettle.headerFromEntry = function (entry) {
        return {"Content-type": entry.contentTypeHeader};
    };
    
    fluid.kettle.contentTypeFromExtension = function (extension) {
        var reg = fluid.kettle.contentTypeRegistry;
        for (var type in reg) {
            if (reg.hasOwnProperty(type)) {
                var el = reg[type];
                if (el.extension === extension) {
                    return fluid.kettle.headerFromEntry(el);
                }
            }
        }
        return "";
    };
    
    fluid.kettle.renderHandler = function (options) {
        var that = fluid.initLittleComponent("fluid.kettle.renderHandler", options);
        
        var cache = {};
        function pathForSegment(segment) {
            return fluid.kettle.pathToFileURL(options.baseDir + segment + "." + that.getContentType(segment).extension);
        }
        function loadTemplate(segment) {
            var path = pathForSegment(segment);
            fluid.setLogging(true);
            fluid.log("Loading template for path " + path);
            var spec = fluid.kettle.loadTemplate(path, that.options.renderOptions);
            return spec;
        }
        function fillCache(segment) {
            if (!cache[segment] || !cache[segment].templates) { // TODO: FS staleness
                var template = loadTemplate(segment);
                cache[segment] = template;
            }
            return cache[segment];
        }
        function segmentHandler(segment) {
            return {
                handle: function (context, env) {
                    var entry = fillCache(segment);
                    var tree = entry.producer(context, env);
                    var markup = fluid.renderTemplates(entry.templates, tree, that.options.renderOptions);
                    var contentType = that.getContentType(segment);
                    return [200, fluid.kettle.headerFromEntry(contentType), markup];
                }
            };
        }
        that.getContentType = function (segment) {
            return that.options.contentType;
        };
        that.accept = function (segment, relPath, parsed) {
            if (parsed.extension && parsed.extension !== that.options.templateExtension) {
                return null;
            }
            fillCache(segment);
            return cache[segment].templates && cache[segment].producer? segmentHandler(segment): null;
        };
        that.registerProducer = function (segment, producer) {
            var entry = fillCache(segment);
            if (entry.fetchError) {
                fluid.log("Producer registered without template - fetch errour " 
                + entry.fetchError.status + ": " + entry.fetchError.textStatus);
            }
            entry.producer = producer;
        };
        return that;
    };

    fluid.kettle.routeApp = function (that, context, env) {
        var segs = context.urlState.pathInfo;
        var root = that.root;
        for (var i = 0; i < segs.length; ++ i) {
            var seg = segs[i];
            var disposition = routeSegment(seg, root, context.urlState, i);
            if (disposition) {
                if (disposition.handle) {
                    return disposition.handle(context, env);
                }
                else {
                    root = disposition.route;
                }
            }
        }
        return [404, "", ""];
    };
    
    fluid.kettle.appRegistry = {};
      
    fluid.kettle.makeKettleApp = function (appName) {
        var that = {};
        that.root = {"*": []};
        that.app = function (env) {
            var context = {env: env};
            context.parsedUri = fluid.parseUri(env.SCRIPT_NAME);
            context.urlState = fluid.kettle.parseUrlState(env);
            return fluid.kettle.routeApp(that, context, env);
        };
        fluid.kettle.appRegistry[appName] = that;
        return that;
    };
  
})(jQuery, fluid);
    
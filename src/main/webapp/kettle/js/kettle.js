/*
Copyright 2008-2009 University of Cambridge

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://source.fluidproject.org/svn/LICENSE.txt
*/

/*global jQuery, fluid, java*/

(function ($, fluid) {
    fluid.kettle = fluid.kettle || {};

    fluid.kettle.computeAbsMounts = function(mounts, baseDir) {
        fluid.transform(mounts, function(mount, key) {
            var absMount = baseDir + mount.source;
            mount.absSource = fluid.kettle.makeCanon(absMount);
            mount.key = key;
        });
    };
    
    fluid.kettle.absoluteHandlerBase = function(absMounts, renderHandlerConfig) {
        var rhc = renderHandlerConfig;
        return absMounts[rhc.sourceMountRelative].absSource + rhc.source;
    }
    /* Expand a "mount-relative" URL of the form $infusion/framework/core/js/Fluid.js
     * as seen, say, in kettleIncludes.json - this may only be used from an active
     * Kettle request
     */
    fluid.kettle.expandMountRelative = function(relative) {
        var config = fluid.threadLocal().config;
        var filePath;
        if (relative.charAt(0) === "$") {
            var spos = relative.indexOf("/");
            if (spos === -1) {
                spos = relative.length;
            }
            var mount = relative.substring(1, spos);
            var absMount = config.mount[mount];
            if (!absMount) {
                fluid.fail("Mount key " + mount + " could not be located within configuration");
            }
            filePath = absMount.absSource + relative.substring(spos);
        }
        else {
            filePath = config.baseDir + relative;
        }
        return fluid.kettle.pathToFileURL(filePath);
    };
    
    fluid.kettle.renderHandlerConfig = function (options) {
        var baseOptions = options.baseOptions || {};
        var source = options.source;
        var mounts = options.config.mount;
       
        var baseDir = mounts[options.sourceMountRelative].absSource + options.source; 
        var rewriter = fluid.kettle.makeUrlRewriter(options.config.mount, options);
       
        var handlerOptions = {
            baseDir: baseDir,
            renderOptions: {
                rebaseURLs: false,
                urlRewriter: rewriter
            }
        };
        handlerOptions = jQuery.extend(true, baseOptions, handlerOptions);
        return handlerOptions;
    };
    
    fluid.kettle.makeUrlRewriter = function (absMounts, renderHandlerConfig) {
        var rhc = renderHandlerConfig;
        var self = fluid.kettle.absoluteHandlerBase(absMounts, rhc);
        var targetDepth = fluid.kettle.parsePathInfo(rhc.target).pathInfo.length;
        var targetPrefix = fluid.kettle.generateDepth(targetDepth - 1);
        return function(url) {
            if (url.charAt(0) === "#") { // TODO: move upstairs into renderer
                return null; // avoid confusing the client by providing physical links
            }
            var urlRewriterKey = fluid.kettle.resolveEnvironment("{params}.urlRewriter");
            if (urlRewriterKey) {
                var urlRewriterI = fluid.kettle.resolveEnvironment("{appStorage}."+urlRewriterKey+".urlRewriter");
            }

            var canon = fluid.kettle.makeCanon(self + url);
            for (var key in absMounts) {
                var mount = absMounts[key];
                var source = mount.absSource;
                if (canon.indexOf(source) === 0) {
                    var extent = canon.substring(source.length);
                    var togo = targetPrefix + mount.target + extent;
                    if (urlRewriterI) {
                        togo = urlRewriterI({mount: mount, targetPrefix: targetPrefix, extent: extent, first: togo});
                    }
                    fluid.log("Rewriting url " + url + " to " + JSON.stringify(togo))
                    return togo;
                }
            }
            fluid.log("url " + url + " failed to match any mount point");
            return null;
        };
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
    
    fluid.kettle.METHOD_NOT_ALLOWED = {};
    
    fluid.kettle.fileExists = function(path) {
        return fluid.kettle.node.fileExists(path); // TODO: IOC
    };
    
    fluid.kettle.mountDirectory = function (absSource, relDirPath) {
        console.log("mountDirectory " + absSource + " "  + relDirPath);
        if (relDirPath === ".") {
            relDirPath = "";
        }
        var absBase = absSource + relDirPath;
        return {
            accept: function (segment, relPath, pathInfo, context) {
                var absPath = absBase + relPath;
                var exists = fluid.kettle.fileExists(absPath);
                fluid.log("File " + absPath + " exists: " + exists);
                return exists ? (context.method === "GET" ? {
                        handle: function (context, env) {
                            return {status: 200, headers: fluid.kettle.contentTypeFromExtension(pathInfo.extension), 
                                body: {type: "file",
                                       path: absPath}};
                        }
                    } : fluid.kettle.METHOD_NOT_ALLOWED) : null;
            }
        };
    };
    
    fluid.kettle.loadTemplate = function (href, options) {
        
        var resourceSpecs = {base: {
                href: href, 
                cutpoints: options.cutpoints,
                options: {async: false}
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
    
    
    fluid.kettle.JSONParser = function(text) {
        // trim required for strangely fascistic NativeJSON impl in Rhino
        return JSON.parse($.trim(text));
    };
    
    /** Accepts a relative path with respect to the given renderHandlerConfig's mount,
     *  and returns an absolute file:// protocol URL from which is can be fetched */
    fluid.kettle.resolveLocalUrl = function(renderHandlerConfig, localPath) {
        var rhc = renderHandlerConfig;
        var config = rhc.config; // IoC here
        var absPath = fluid.kettle.absoluteHandlerBase(config.mount, rhc) + localPath;
        absPath = fluid.kettle.makeCanon(absPath);
        return fluid.kettle.pathToFileURL(absPath);
    };
    
    fluid.kettle.getLocalData = function(renderHandlerConfig, localPath, responseParser) {
        var data = fluid.kettle.operateUrl(fluid.kettle.resolveLocalUrl(renderHandlerConfig, localPath), responseParser);
        return data.data? data.data : null;
    };
    
    fluid.kettle.makeErrorResponse = function(data) {
        var message = "Error fetching data - " + data.textStatus;
        if (data.errorThrown) {
            message += " - Thrown error: " + data.errorThrown;
        }
        return {status: 500, headers: fluid.kettle.plainHeader, body: message};
    };

// This is really a "mappedDataSource" - the functionality it applies above the base is
// to apply a function computed from "options.outputMapper" to the returned results.
    fluid.kettle.dataSource = function(options) {
        var that = fluid.initLittleComponent("fluid.kettle.dataSource", options);
        fluid.log("Creating dataSource with options " + JSON.stringify(that.options));
        // TODO: non-standard layout and odd knowledge of argument
        var srcOpt = that.options.source;
        var type = srcOpt.type;
        delete srcOpt.type;
        that.source = fluid.invokeGlobalFunction(type, [srcOpt]);
        that.get = function() {
            var togo = that.source.get.apply(null, arguments);
            if (!togo.isError && that.options.outputMapper) {
                togo.data = fluid.invokeGlobalFunction(that.options.outputMapper, [togo.data].concat($.makeArray(arguments)));
            }
            return togo;
        }
        if (that.source.put) {
           that.put = function() {
               var togo = that.source.put.apply(null, arguments);
               // TODO - apply INVERSE MAPPING if we can compute it from outputMapper!
               return togo;
           };
        }
        return that;
    };

    fluid.kettle.disposeSpout = function(spout, options) {
        if (options.init) {
            fluid.registerGlobalFunction(options.init, togo);
            }
        else {
            fluid.kettle.queueInvocation("fluid.engage.initEngageApp", 
                {func: spout, args: ["{config}", "{app}", "{appStorage}"]});
        }
    };
    
    fluid.kettle.dataSpout = function(options) {
        var content = fluid.kettle.contentTypeRegistry[options.contentType];
        var togo = function (config, app) {
            var source = fluid.getGlobalValue(options.source.name);
            var handler = function (context) {
                var args = fluid.makeArray(fluid.kettle.resolveEnvironment(options.source.args));
                var data;
                if (context.method === "GET") {
                   data = source.get.apply(null, args);
                }
                else {
                   var body = fluid.kettle.JSONParser(context.env.jsgi.input);
                   data = source.put.apply(null, [body].concat(args));
                }
                if (data.isError) {
                    return fluid.kettle.makeErrorResponse(data);
                }
                else {
                    data = data.data;                       
                    if (options.contentType === "JSON") { // TODO: any other content types
                        data = JSON.stringify(data);
                    }
                    return {status: 200, headers: fluid.kettle.headerFromEntry(content), body: data};
                }
            };
            var parsed = fluid.kettle.parsePathInfo(options.url); // TODO: support length other than 2
            if (parsed.pathInfo.length !== 2) {
                fluid.fail("URL depth other than 2 currently unsupported");
            }
            var terminal = parsed.pathInfo[parsed.pathInfo.length - 1];
    
            var acceptor = fluid.engage.makeAcceptorForResource(terminal, content.extension, handler, source.put? "GET|POST|PUT" : "GET");
            fluid.engage.mountAcceptor(app, parsed.pathInfo[0], acceptor);
        };
        fluid.kettle.disposeSpout(togo, options);
        return togo;
    };
    
    fluid.kettle.markupSpout = function(options) {
        var togo = function (config, app) {
            var rhc = options.renderHandlerConfig;
            rhc.config = config;
            rhc.app = app;
            var handler = fluid.engage.mountRenderHandler(rhc);
            fluid.transform(options.producers, function(value, key) {
                handler.registerProducer(key, function(context) {
                    return value(context, rhc);
                })});
        }
        fluid.kettle.disposeSpout(togo, options);
        return togo;
    };
    
    fluid.kettle.getBundle = function(renderHandlerConfig, params) {
        if (params.lang) {
            return fluid.kettle.getLocalData(renderHandlerConfig, "../messages/messages_"+params.lang+".json", fluid.kettle.JSONParser);
        }
        else {
            return null;
        }
 
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
                    if (!tree.isError) {
                        if (tree.tree) { // TODO: Backwards compatibility for old producers
                            tree = tree.tree;
                        }
                        var markup = fluid.renderTemplates(entry.templates, tree, that.options.renderOptions);
                        var contentType = that.getContentType(segment);
                        return {status: 200, headers: fluid.kettle.headerFromEntry(contentType), body: markup};
                    }
                    else {
                        return kettle.makeErrorResponse(tree);
                    }
                }
            };
        }
        that.getContentType = function (segment) {
            return that.options.contentType;
        };
        that.accept = function (segment, relPath, parsed, context) {
            if (parsed.extension && parsed.extension !== that.options.templateExtension) {
                return null;
            }
            if (context.method !== "GET") {
                return fluid.kettle.METHOD_NOT_ALLOWED;
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

    function routeSegment(segment, root, parsed, index, context) {
        if (!segment) {
            segment = "/";
        }
        var exist = root[segment];
        console.log("Root at " + segment + ": " + exist);
        if (exist) {
            return {route: exist};
        }
        var relPath = fluid.kettle.makeRelPath(parsed, index);
        var defs = fluid.makeArray(root["*"]);
        var notAllowed;
        for (var i = 0; i < defs.length; ++ i) {
            var rule = defs[i];
            var accept = rule.accept(segment, relPath, parsed, context);
            if (accept) {
                if (accept === fluid.kettle.METHOD_NOT_ALLOWED) {
                    notAllowed = accept;
                }
                else {
                    return accept;
                }
            }
        }
        if (notAllowed) {
            return notAllowed;
        }
    }

    fluid.kettle.routeApp = function (that, context) {
        var segs = context.urlState.pathInfo;
        var root = that.root;
        var disposition;
        fluid.log("routing segments " + JSON.stringify(segs));
        for (var i = 0; i < segs.length; ++ i) {
            var seg = segs[i];
            disposition = routeSegment(seg, root, context.urlState, i, context);
            if (disposition && disposition !== fluid.kettle.METHOD_NOT_ALLOWED) {
                if (disposition.handle) {
                    return disposition.handle(context, context.env);
                }
                else {
                    root = disposition.route;
                }
            }
        }
        return disposition === fluid.kettle.METHOD_NOT_ALLOWED?
        {status: 405, headers: fluid.kettle.plainHeader, body: "Fluid Kettle: Method " + context.method + " was not allowed on resource " + context.env.scriptName}:
        {status: 404, headers: fluid.kettle.plainHeader, body: "Fluid Kettle: Url " + context.env.scriptName + " could not be resolved"};
    };
    
    fluid.kettle.createMockEnv = function(method, url) {
        var togo = {};
        var path = url;
        var query;
        var qpos = url.indexOf("?");
        if (qpos !== -1) {
            path = url.substring(0, qpos);
            query = url.substring(qpos + 1);
        }
        togo.method = method;
        togo.scriptName = path;
        togo.pathInfo = "/mount-point/" + path;

        if (query) {
            togo.queryString = query;
        }
        return togo;
    };
    
    fluid.kettle.makeRequest = function(app, method, url) {
        var env = fluid.kettle.createMockEnv(method, url);
        return app(env);
    };
    
    fluid.kettle.appRegistry = {};
      
    fluid.kettle.makeKettleApp = function (config, appStorage) {
        var that = {};
        that.root = {"*": []};
        that.app = function (env) {
            var context = {env: env};
            context.urlState = fluid.kettle.parseUrlState(env);
            context.method = env.method;
            return fluid.kettle.withEnvironment(
                {config: config,
                 app: that.app,
                 appStorage: appStorage,
                 context: context,
                 params: context.urlState.params},
                 function() {
                     return fluid.kettle.routeApp(that, context);
                     });
        };
        appStorage.appHolder = that;
        fluid.kettle.appRegistry[config.appName] = {appStorage: appStorage, config: config};
        return that;
    };
  
})(jQuery, fluid);
    
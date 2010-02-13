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

    fluid.kettle.computeAbsMounts = function(mounts, baseDir) {
        fluid.transform(mounts, function(mount) {
            var absMount = baseDir + mount.source;
            mount.absSource = fluid.kettle.makeCanon(absMount);
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
            if (url.charAt(0) === "#") {
                return null; // avoid confusing the client by providing physical links
            }
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
    
    fluid.kettle.mountDirectory = function (baseDir, relDirPath) {
        if (relDirPath === ".") {
            relDirPath = "";
        }
        var absBase = baseDir + relDirPath;
        return {
            accept: function (segment, relPath, pathInfo, context) {
                var absPath = absBase + relPath;
                var file = new java.io.File(absPath); // TODO: Unportability here
                var exists = file.exists();
                fluid.log("File " + absPath + " exists: " + exists);
                return exists ? (context.method === "GET" ? {
                        handle: function (context, env) {
                            return [200, fluid.kettle.contentTypeFromExtension(pathInfo.extension), file];
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
        return [500, fluid.kettle.plainHeader, message];
    };
    
    fluid.kettle.withEnvironment = function(envAdd, func) {
        var root = fluid.threadLocal();
        try {
            $.extend(root, envAdd);
            return func();
        }
        finally {
            for (var key in envAdd) {
               delete root[key];
            }
        }
    };

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
    // Taken from jquery.couch.js
    function encodeDocId(docID) {
      var parts = docID.split("/");
      if (parts[0] == "_design") {
        parts.shift();
        return "_design/" + encodeURIComponent(parts.join('/'));
      }
      return encodeURIComponent(docID);
    }

    fluid.kettle.couchDBSource = function(options) {
        fluid.log("Creating couchDBSource with writeable = " + options.writeable);
        function resolveUrl(resOptions, directModel) {
            var expanded = fluid.kettle.resolveEnvironment(resOptions, directModel);
            if (expanded.funcName) { // what other forms of delivery might there be?
                return fluid.invokeGlobalFunction(expanded.funcName, expanded.args);
            }
        }
        var that = fluid.initLittleComponent("fluid.kettle.couchDBSource", options);
        that.get = function(directModel) {
            var url = resolveUrl(that.options.urlBuilder, directModel);
            if (url) {
                return fluid.kettle.operateUrl(url, fluid.kettle.JSONParser);
            }
        };
        if (options.writeable) {
            that.put = function(model, directModel) {
                var url = resolveUrl(that.options.urlBuilder, directModel);
                var expanded = fluid.kettle.resolveEnvironment(that.options, directModel);
                var ajaxOpts = {data: JSON.stringify(model), contentType: fluid.kettle.contentTypeRegistry.JSON.contentTypeHeader};
                   if (model._id === undefined) {
                       ajaxOpts.type = "POST";
                   } else {
                       ajaxOpts.type = "PUT";
                       url = url + encodeDocId(doc._id);
                   }
                return fluid.kettle.operateUrl(url, fluid.kettle.JSONParser, ajaxOpts);
                };
            }
        return that;
    };
    
        
    fluid.kettle.encodeCouchDBKey = function(key, keyList) {
        if (!keyList || fluid.isPrimitive(key) || fluid.isArrayable(key)) {
            return JSON.stringify(key);
        }
        else {
            var els = [];
            for (var i = 0; i < keyList.length; ++ i) {
                var keyName = keyList[i]; // TODO: perhaps one day we may want to support nested keys!
                var keyValue = key[keyName];
                if (keyValue !== undefined) {
                    els.push("\"" + keyName +"\":" + JSON.stringify(key[keyName]));
                }
            }
            return "{" + els.join(",") + "}";
        }
    }
    
    /** Render a URL suitable for querying a CouchDB view requiring a key, according a
     * to a particular serialization order (CouchDB views are sequence-sensitive and
     * cannot be trusted to JSON.stringify http://issues.fluidproject.org/browse/ENGAGE-387)
     * @param template A template in the format expected by fluid.stringTemplate, or a structure
     *  {template: "My %template", keyList: ["key1", "key2"]} 
     * @param args A map of arguments - the one named "key" will be interpreted and serialised
     * specially
     */
    fluid.kettle.couchDBViewTemplate = function(template, args) {
        args = fluid.copy(args);
        if (args.key !== undefined) {
            var keyList;
            if (typeof(args.view) !== "string") {
                keyList = args.view.keyList;
                args.view = args.view.view;
            }
            args.key = fluid.kettle.encodeCouchDBKey(args.key, keyList);
        }
        return fluid.stringTemplate(template, args);
    };
    
    // to integrate with FluidIoC
    fluid.parseContextReference = function(reference, index, delimiter) {
        var endcpos = reference.indexOf("}", index + 1);
        if (endcpos === -1) {
            fluid.fail("Malformed context reference without }");
        }
        var context = reference.substring(index + 1, endcpos);
        var endpos = delimiter? reference.indexOf(delimiter, endcpos + 1) : reference.length;
        var path = reference.substring(endcpos + 1, endpos);
        if (path.charAt(0) === ".") {
            path = path.substring(1);
        }
        return {context: context, path: path, endpos: endpos};
    };
    
    function fetchContextReference(parsed, env) {
        var base = env[parsed.context];
        if (!base) {
            fluid.fail("Context " + parsed.context + " could not be resolved in current environment");
        }
        return fluid.model.getBeanValue(base, parsed.path);
    }
    
    function resolveValue(string, directModel, env) {
        if (string.charAt(0) === "{") {
            var parsed = fluid.parseContextReference(string, 0);
            return fetchContextReference(parsed, env);        
        }
        while (true) {
            var i1 = string.indexOf("${");
            var i2 = string.indexOf("}", i1 + 2);
            if (i1 !== -1 && i2 !== -1) {
                var subs, path;
                if (string.charAt(i1 + 2) === "{") {
                    var parsed = fluid.parseContextReference(string, i1 + 2, "}");
                    i2 = parsed.endpos;
                    subs = fetchContextReference(parsed, env);
                    path = parsed.path;
                }
                else {
                    path = string.substring(i1 + 2, i2);
                    subs = fluid.model.getBeanValue(directModel, path);
                }
                if (subs === undefined) {
                    fluid.fail("Unable to resolve substitution value at path " + path + " within model for expression " + string);
                    }
                string = string.substring(0, i1) + subs + string.substring(i2 + 1);
            }
            else {
                break;
            }
        }
        return string;
    }
    
    function resolveEnvironmentImpl(obj, directModel, env) {
        return fluid.transform(obj, function(value, key) {
            if (typeof(value) === "string") {
                 return resolveValue(value, directModel, env);
               }
            else if (fluid.isPrimitive(value)) {
                return value;
            }
            else return resolveEnvironmentImpl(value, directModel, env);
        });
    }
    
    fluid.kettle.resolveEnvironment = function(obj, directModel) {
        directModel = directModel || {};
        var env = fluid.threadLocal();
        return resolveEnvironmentImpl(obj, directModel, env);
    };

    function getInvocationQueue(target) {
        var exist = invocationQueue[target];
        if (!invocationQueue[target]) {
            invocationQueue[target] = exist = {queue: []}; 
        }
        return exist;
    }

    var invocationQueue = {};
    // NB: This global state assumes that startup is single-threaded
    fluid.kettle.queueInvocation = function(target, packet) {
        var exist = getInvocationQueue(target);
        exist.queue.push(packet);
        if (exist.handler) {
            exist.handler();
        }
    };
    
    fluid.kettle.dequeueInvocations = function(target, environment) {
         var handler = function() {
             fluid.kettle.withEnvironment(environment, function() {
                 var queued = fluid.makeArray(invocationQueue[target].queue);
                 for (var i = 0; i < queued.length; ++ i) {
                     var resolved = fluid.kettle.resolveEnvironment(queued[i]);
                     if (resolved.func) {
                         resolved.func.apply(null, resolved.args);
                     }
                     else if (resolved.funcName) {
                         fluid.invokeGlobalFunction(resolved.funcName, resolved.args);
                     }
                 }
                 invocationQueue[target].queue = []; // TODO: finally block?
             });
         }
         
         getInvocationQueue(target).handler = handler;
         handler();
    };
    
    fluid.kettle.disposeSpout = function(spout, options) {
        if (options.init) {
            fluid.registerGlobalFunction(options.init, togo);
            }
        else {
            fluid.kettle.queueInvocation("fluid.engage.initEngageApp", {func: spout, args: ["{config}", "{app}"]});
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
                     return [200, fluid.kettle.headerFromEntry(content), data];
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
            for (var key in options.producers) {
                handler.registerProducer(key, function(context) {
                    return options.producers[key](context, rhc);
                });
            }
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
                        return [200, fluid.kettle.headerFromEntry(contentType), markup];
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
        [405, fluid.kettle.plainHeader, "Fluid Kettle: Method " + context.method + " was not allowed on resource " + context.env.SCRIPT_NAME]:
        [404, fluid.kettle.plainHeader, "Fluid Kettle: Url " + context.env.SCRIPT_NAME + " could not be resolved"];
    };
    
    fluid.kettle.appRegistry = {};
      
    fluid.kettle.makeKettleApp = function (config) {
        var that = {};
        that.root = {"*": []};
        that.app = function (env) {
            var context = {env: env};
            context.parsedUri = fluid.parseUri(env.SCRIPT_NAME);
            context.urlState = fluid.kettle.parseUrlState(env);
            context.method = env.REQUEST_METHOD;
            return fluid.kettle.withEnvironment(
                {config: config,
                 app: that.app,
                 context: context,
                 params: context.urlState.params},
                 function() {
                     return fluid.kettle.routeApp(that, context);
                     });
        };
        fluid.kettle.appRegistry[config.appName] = that;
        return that;
    };
  
})(jQuery, fluid);
    
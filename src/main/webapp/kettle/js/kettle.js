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
    
    fluid.kettle.mountDirectory = function (baseDir, relDirPath) {
        if (relDirPath === ".") {
            relDirPath = "";
        }
        var absBase = baseDir + relDirPath;
        return {
            accept: function (segment, relPath, pathInfo) {
                var absPath = absBase + relPath;
                var file = new java.io.File(absPath); // TODO: Unportability here
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
    
    fluid.kettle.getDataFromUrl = function(url) {
        var togo = {};
        function success(responseText, textStatus) {
             // trim required for strangely fascistic NativeJSON impl in Rhino
            togo.data = JSON.parse($.trim(responseText));
            togo.textStatus = textStatus;
        }
        function error(xhr, textStatus, errorThrown) {
            fluid.log("Data fetch error - textStatus: " + textStatus);
            fluid.log("ErrorThrown: " + errorThrown);
            togo.textStatus = textStatus;
            togo.errorThrown = errorThrown;
            togo.isError = true;
        }
        $.ajax({
            url: url,
            success: success,
            error: error
        });
        return togo;
    };

    
    fluid.kettle.getLocalData = function(renderHandlerConfig, localPath) {
        var rhc = renderHandlerConfig;
        var config = rhc.config; // IoC here
        var absPath = fluid.kettle.absoluteHandlerBase(config.mount, rhc) + localPath;
        var data = fluid.kettle.getDataFromUrl(fluid.kettle.pathToFileURL(absPath));
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

    fluid.kettle.makeDataSource = function(options) {
        var that = fluid.initLittleComponent("fluid.kettle.renderHandler", options);
        // TODO: non-standard layout and odd knowledge of argument
        var srcOpt = that.options.source;
        that.source = fluid.invokeGlobalFunction(srcOpt.type, [srcOpt.urlBuilder]);
        that.get = function() {
            var togo = that.source.get.apply(null, arguments);
            if (!togo.isError && that.options.outputMapper) {
                togo.data = fluid.invokeGlobalFunction(that.options.outputMapper, [togo.data].concat($.makeArray(arguments)));
            }
            return togo;
        }
        return that;
    };

    fluid.kettle.couchDBSource = function(options) {
        var that = fluid.initLittleComponent("fluid.kettle.couchDBSource", options);
        that.get = function(directModel) {
            var expanded = fluid.kettle.resolveEnvironment(that.options, directModel);
            if (expanded.funcName) { // what other forms of delivery might there be?
                var url = fluid.invokeGlobalFunction(expanded.funcName, expanded.args);
                var togo = fluid.kettle.getDataFromUrl(url);
                return togo;
            }
        }
        return that;
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

    var invocationQueue = {};
    // NB: This global state assumes that startup is single-threaded
    fluid.kettle.queueInvocation = function(target, packet) {
        var exist = invocationQueue[target];
        if (!exist) {
            invocationQueue[target] = exist = {queue: []};
        }
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
         invocationQueue[target].handler = handler;
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
            var handler = function (context) {
                 var args = fluid.makeArray(fluid.kettle.resolveEnvironment(options.source.args));
                 var source = fluid.getGlobalValue(options.source.name);
                 var data = source.get.apply(null, args);
                 if (data.isError) {
                     return fluid.kettle.makeErrorResponse(data);
                 }
                 else {
                     var data = data.data;                       
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
    
            var acceptor = fluid.engage.makeAcceptorForResource(terminal, content.extension, handler);
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
            return fluid.kettle.getLocalData(renderHandlerConfig, "../messages/messages_"+params.lang+".json");
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
        for (var i = 0; i < defs.length; ++ i) {
            var rule = defs[i];
            var accept = rule.accept(segment, relPath, parsed, context);
            if (accept) {
                return accept;
            }  
        }
    }

    fluid.kettle.routeApp = function (that, context) {
        var segs = context.urlState.pathInfo;
        var root = that.root;
        for (var i = 0; i < segs.length; ++ i) {
            var seg = segs[i];
            var disposition = routeSegment(seg, root, context.urlState, i, context);
            if (disposition) {
                if (disposition.handle) {
                    return disposition.handle(context, context.env);
                }
                else {
                    root = disposition.route;
                }
            }
        }
        return [404, fluid.kettle.plainHeader, "Fluid Kettle: Url " + context.env.SCRIPT_NAME + " could not be resolved"];
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
    
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
            return base;
        }
        return fluid.model.getBeanValue(base, parsed.path);
    }
    
    function resolveValue(string, directModel, env) {
        if (string.charAt(0) === "{") {
            var parsed = fluid.parseContextReference(string, 0);
            return fetchContextReference(parsed, env);        
        }
        while (typeof(string) === "string") {
            var i1 = string.indexOf("${");
            var i2 = string.indexOf("}", i1 + 2);
            var all =  (i1 === 0 && i2 === string.length - 1); 
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
                // TODO: test case for all undefined substitution
                if (subs === undefined || subs === null) {
                    return subs;
                    }
                string = all? subs : string.substring(0, i1) + subs + string.substring(i2 + 1);
            }
            else {
                break;
            }
        }
        return string;
    }
    
    function resolveEnvironmentImpl(obj, directModel, env) {
        if (typeof(obj) === "string") {
            return resolveValue(obj, directModel, env);
        }
        else if (fluid.isPrimitive(obj)) {
            return obj;
        }
        else return fluid.transform(obj, function(value, key) { 
            return resolveEnvironmentImpl(value, directModel, env);
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

})(jQuery, fluid);
    
/*
Copyright 2008-2009 University of Cambridge
Copyright 2008-2009 University of Toronto

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://source.fluidproject.org/svn/LICENSE.txt
*/

var fluid_1_2 = fluid_1_2 || {};
var fluid = fluid || fluid_1_2;

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
	    
	    function paramsToMap(queryString) {
	        var togo = {}
	        var segs = queryString.split("&");
	        for (var i = 0; i < segs; ++ i) {
	            var seg = segs[i];
	            var eqpos = seg.indexOf("=");
	            var key = seg.substring(0, eqpos);
	            var value = seg.substring(eqpos + 1);
	            push(togo, key, value);
	        }
	        return togo;
      }
	    
	    fluid.kettle.parseUrlState = function(env) {
	        var togo = {};
	        var pathInfo = env["PATH_INFO"];
	        var segs = togo = pathinfo.split("/");
     //     if (segs.length > 0 && !segs[0]) {
     //         segs = segs.slice(1);
     //     }
          togo.pathInfo = segs;
          togo.params = paramsToMap(env["QUERY_STRING"]);
          return togo;
	    };

      function routeSegment(segment, root) {
          if (!segment) {segment = "/"};
          var exist = root[segment];
          if (exist) {
            return exist;
          }
          var defs = root["*"];
          for (var i = 0; i < defs.length; ++ i) {
            var rule = defs[i];
            return rule.accept(segment);
          }
      }
      
      fluid.initLittleComponent = function(name, options) {
          var that = {};
          fluid.mergeComponentOptions(that, name, options);
          return that;
      }
      
      fluid.defaults("fluid.kettle.renderHandler", 
          {   
              // TODO: allow to vary over the app
              contentType: fluid.kettle.contentTypeRegistry.HTML,
              renderOptions: {
                  serialDecorators: true
              }
          }
      );
      
      fluid.kettle.loadTemplate = function (href, options) {
          
          var resourceSpecs = {base: {resourceText: fluid.extractTemplate(node, options.armouring), 
                          href: href, resourceKey: href, cutpoints: options.cutpoints}
                          };
          fluid.fetchResources(resourceSpecs, function(){}); // synchronous server I/O
          var togo = {resourceSpecs: resourcesSpecs};
          if (!resourcesSpecs.base.fetchError) {
              togo.templates = fluid.parseTemplates(resourceSpec, ["base"], options);
          }
          return togo;
      }
      
      fluid.kettle.renderHandler = function(options) {
          var that = initLittleComponent("fluid.kettle.renderHandler", options);
          var cache = {};
          function pathForSegment(segment) {
            return options.baseDir + segment + "." + that.getContentType(segment).extension;
          }
          function loadTemplate(segment) {
              var path = pathForSegment(segment);
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
              return function(context, env) {
                  var entry = fillCache(segment);
                  var tree = entry.producer(context, env);
                  var markup = fluid.renderTemplates(entry.templates, tree, that.options.renderOptions);
                  var contentType = that.getContentType(segment);
                  return [200, contentType.contentTypeHeader, markup];
              };
          }
          that.getContentType = function (segment) {
              return that.options.contentType;
          }
          that.accept = function(segment) {
              fillCache(segment);
              return cache[segment].templates? segmentHandler(cache[segment]): null;
          }
          that.registerProducer = function(segment, producer) {
              var entry = fillCache(segment);
              entry.producer = producer;
          }
          return that;
      };

      fluid.kettle.routeApp = function (that, context, env) {
          var segs = context.pathInfo;
          var root = that.root;
          for (var i = 0; i < segs; ++ i) {
              var seg = segs[i];
              var disposition = routeSegment(seg, root);
              if (disposition) {
                if (disposition.handle) {
                   return disposition.handle(context, env);
                }
                else root = disposition.route;
              }
          }
          return [404, "", ""];
      };
	    
	    fluid.kettle.appRegistry = {};
	    
	    fluid.kettle.makeKettleApp = function(appName) {
	        var that = {};
	        that.root = {"*": []};
	        that.app = function(env) {
    	        var context = {env: env};
    	        context.parsedUri = fluid.parseUri(env["REQUEST_URI"]);
    	        context.urlState = fluid.kettle.parseUrlState(env);
    	        return fluid.kettle.routeApp(that, context, env);
    	    }
    	    appRegistry[appName] = that;
    	    return that;
	    };
	
})(jQuery, fluid_1_2);
    
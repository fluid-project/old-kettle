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
    
    
    fluid.kettle.couchDBViewBuilder = function(options) {
        function expect(members, target) {
            fluid.transform($.makeArray(members), function(key) {
                if (!target[key]) {
                    fluid.fail("Builder options missing required parameter " + key);
                }
            });
        }
        expect(["baseUrl", "dbName", "design", "view"], options);

        var stub = fluid.stringTemplate("%baseUrl/%dbName/design/%design/_view/%view", options);
        var params = {};
        if (options.startkeyExtend) {
            expect("endkey", options);
            options.startkey = $.extend(true, {}, options.endkey, options.startkeyExtend);
        }
        if (options.endkeyExtend) {
            expect("startkey", options);
            options.endkey = $.extend(true, {}, options.startkey, options.endkeyExtend);
        }
        if (options.key || options.startkey || options.endkey) {
            expect("keyList", options);
        }
        fluid.transform(["key", "startkey", "endkey"], function (key) {
            if (options[key] !== undefined) {
                params[key] = fluid.kettle.encodeCouchDBKey(options[key], options.keyList);
            }
        });
        fluid.transform(["limit", "descending", "skip", "include-docs"], function (key) {
            if (options[key] !== undefined) {
                params[key] = options[key];
            }
        });
        return stub + "?" + $.param(params);
    };
    
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
      
})(jQuery, fluid);
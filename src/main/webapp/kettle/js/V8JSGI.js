
/** Impl adapted from 
 * https://github.com/kriszyp/jsgi-node/blob/master/lib/jsgi-node.js
 * For now we do not require streaming or support for promise-based I/O.
 * Original licence statement: 
 * JSGI-Node is licensed under the AFL or BSD license.
 * Authors include Kris Zyp and Jed Schmidt.
 */

(function ($, fluid) {

fluid.registerNamespace("fluid.kettle.V8");

var sys = require("sys");

fluid.kettle.V8.jsgiDefaults = {
    jsgi: {
        version: [ 0, 3 ],
        multithread: false,
        multiprocess: true,
        async: true,
        runOnce: false,
        errors: {
            print: sys.puts,
            flush: function(){}
        }
    },
    env: {},
    queryString: "",
    scriptName: "",
    body: "",
    scheme: "http"
};


fluid.kettle.V8.process = function (app, request, response) {
    var env = {};
    $.extend(true, env, fluid.kettle.V8.jsgiDefaults);
    env.method = request.method;
    env.headers = request.headers;
    var url = request.url || "";
    if (url.charAt(0) === "/") {
        url = url.substring(1);
    }
    var qpos = url.indexOf("?");
    if (qpos !== -1){
        env.pathInfo = url.substring(0, qpos);
        env.queryString = url.substring(qpos + 1);
    }
    else {
        env.pathInfo = url;
    }
    var host = request.headers.host;
    env.host = host ? host.split(":")[0] : "";
    env.port = host ? (host.split(":")[1] || 80) : 80;
    env.remoteAddr = request.connection.remoteAddress;
    env.version = [request.httpVersionMajor, request.httpVersionMinor ];
    
    // non-standard members
    env.nodeRequest = request;
    env.requestURI = env.scriptName = url;
    
    request.addListener("data", function(chunk) {
        env.body += chunk;
        });
 
    request.addListener("end", function() {
        fluid.log("Calling app for " + env.method + " of " + env.scriptName);
        var result = app.app(env);
        console.log(JSON.stringify(result));
        fluid.log("App concluded with status " + result.status);
        response.writeHead(result.status, result.headers);
        fluid.kettle.node.writeBody(response, result.body);
        });
};

})(jQuery, fluid);
   
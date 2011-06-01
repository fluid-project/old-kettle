/** The Fluid-aware portion of the V8 boot code **/

(function ($, fluid) {

    fluid.asyncEachHead = function(keys, source, func, cont) {
        if (keys.length > 0) {
            var headKey = keys.shift();
            func(source[headKey], headKey, function() {
                fluid.asyncEachHead(keys, source, func, cont);  
            });
        }
        else {
            cont();
        }          
    };
    
    fluid.asyncEach = function(source, func, cont) {
        var keys = [];
        fluid.each(source, function(value, key) { keys.push(key);});
        fluid.log("Processing keys " + JSON.stringify(keys));
        fluid.asyncEachHead(keys, source, func, cont);
    };
    
    fluid.registerNamespace("fluid.kettle.node");
    
    fluid.kettle.node.loadApp = function(config, app, appEntry, dir, cont) {
        var includes = fluid.makeArray(appEntry.includes);
        console.log("Loading app with initFunction " + appEntry.initFunction);
        fluid.kettle.node.loadIncludes(includes, config, dir, function() {
            if (appEntry.initFunction) {
                fluid.invokeGlobalFunction(appEntry.initFunction, [config, app]);
            }
            cont();
        });
    };

    fluid.kettle.node.loadApps = function(config, app, cont) {
        fluid.asyncEach(config.appPaths, function(path, key, cont) {
            var path = config.baseDir + path;
            var dir = fluid.kettle.fileToDir(path);
            var appConfig = fluid.kettle.node.readJSONFile(path);
            console.log("Loaded appConfig " + fluid.prettyPrintJSON(appConfig));
            if (appConfig.mount) {
                fluid.kettle.computeAbsMounts(appConfig.mount, dir);
                $.extend(true, config.mount, appConfig.mount);
                console.log("Mount table: " + fluid.prettyPrintJSON(config.mount));
            }
            fluid.asyncEach(appConfig.apps, function(appEntry, key, cont) {
                fluid.kettle.node.loadApp(config, app, appEntry, dir, cont);
            }, cont);
        }, cont);
    };
    
    var http = require("http");
        
    fluid.kettle.node.startServer = function(config, app) {
        var server = http.createServer(function (req, res) {
            fluid.invokeGlobalFunction(config.handlerFunction, [app, req, res]);
        }).listen(config.port, config.hostname);
        console.log("Server running on port " + config.port);
        return server;
    };
    
    var fs = require("fs");
    
    fluid.kettle.node.fileExists = function(path) {
        try {
            var stat = fs.statSync(path);
        }
        catch (e) {}
        console.log("Stat of " + path + ": " + JSON.stringify(stat));
        return !!stat;
    };
    
    fluid.kettle.node.writeBody = function(response, body) {
        if (typeof(body) === "string") {
            response.write(body);
            response.end();
        }
        else if (body.type === "file") {
            console.log("pump " + body.path);
            fs.createReadStream(body.path).pipe(response);
            console.log("Pumping");
        }
    };
    
})(jQuery, fluid);
   
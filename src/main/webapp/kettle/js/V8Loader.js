(function() {

    var fs = require("fs");
    
    // Primordial, framework-free portion of Kettle
    var kettle = {
        version: "0.1",
        node: {}
    };
    
    console.log("\nKettle version " + kettle.version + " starting");
    
    kettle.node.readJSONFile = function(path) {
        try {
            var file = fs.readFileSync(path);
            var json = JSON.parse(file);
            return json;
        }
        catch (e) {
            console.log("Error reading JSON file at " + path);
            throw e;
        }
    };
    
    kettle.fileToDir = function(filename) {
        var ourSP = filename.lastIndexOf("/");
        var ourDir = filename.substring(0, ourSP + 1);
        return ourDir;       
    };
    
    kettle.node.getBaseDir = function() {
        return __dirname + "/../../";  
    }; 
    
    kettle.node.loadScript = function(path, callback) {
        var tag = window.document.createElement("script");
        tag.src = path;
        window.document.head.appendChild(tag);
  
        tag.onload = function() {
            callback(path);
        };
    };
    
    // copied from kettle.js for bootstrapping, deframeworkised
    kettle.computeAbsMountsBoot = function(mounts, baseDir) {
        for (var key in mounts) {
            var mount = mounts[key];
            var absMount = baseDir + mount.source;
            mount.absSource = absMount; // fluid.kettle.makeCanon(absMount);
            mount.key = key;
        }
    };
    
    // copied from kettle.js for bootstrapping
    kettle.expandMountPath = function(config, baseDir, relative) {
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
            filePath = baseDir + relative;
        }
        return filePath;      
    };
    
    // Apply a timeout to get more sensible error messages from the global handler
    kettle.invokeLater = function(func) {
        return function() {
            setTimeout(function() {
                func();
            }, 1);
        };
    };
    
    kettle.node.loadIncludes = function(includes, config, baseDir, finalCallback) {
        var i = 0;
        var loadNext = function() {
            if (kettle.node.lasterror) {
                throw kettle.node.lasterror.error;
            }
            var include = includes[i];
            var expanded = kettle.expandMountPath(config, baseDir, include);
            console.log("Loading script index " + i + " relative path " + include + " expanded path " + expanded);
            ++i;
            kettle.node.loadScript(expanded, i == includes.length? kettle.invokeLater(finalCallback) : loadNext);

        };
        loadNext();
    };
    
    var baseDir = kettle.node.getBaseDir();

    // Process of "ClassLoader" juggling to bolt together our global "window", jsdom and XHR
    var jsdom = require("jsdom");
    var XMLHttpRequest = require("fluid-xhr");
    
    var document = jsdom.jsdom("<html><head></head><body>HELLO KETTOL WORLD</body></html>");
    document.onerror = function(event) {
        console.log("Error loading script " + event.data.filename + ": " + event.data.error + " at " + event.data.error.stack);
        kettle.node.lasterror = event.data;
        // Cannot throw due to infinite recursion
        // throw event.data.error;
    };
    var window = document.createWindow();
    window.require = require; // allow the module loader to be resolvable from inside the NEW WORLD
    window.__proto__.XMLHttpRequest = XMLHttpRequest; // allow xhr implementation to be seen from window
    window.location.search = ""; // Required by Fluid 1.4 to find "notrycatch", fix this up
    var Context = process.binding('evals').Context;
    var global = window.__scriptContext = new Context(); // this is where it is mysteriously stashed by jsdom
    global.console = console; // mysteriously, new jsdom does not poke it in
    global.__proto__ = window;
    var fluid = global.fluid_1_4 = {
        kettle: {}
    };
    for (var key in kettle) { // copy in primordial contents of kettle namespace into the new world
        if (!fluid.kettle[key]) {
            fluid.kettle[key] = kettle[key];
        }
    }
    
    var config = kettle.node.readJSONFile(baseDir + "application/kettleConfig.json");
    var includes = kettle.node.readJSONFile(baseDir + config.includes);
    config.baseDir = baseDir;

    kettle.node.initApp = function() {
        console.log("Loaded Fluid " + fluid.version);
      // use the proper framework version to compute canonicalised mounts
        fluid.kettle.computeAbsMounts(config.mount, baseDir);
        console.log("Framework includes loaded");
        if (config.debugMode) {
            fluid.setLogging(true);
        }
        var $ = global.jQuery;
        // The Fluid and Kettle frameworks have now loaded, dispatch into them to load applications and finally init server:
        var appStorage = {};
        var app = fluid.kettle.makeKettleApp(config, appStorage);
        console.log("Got app ", app);
        console.log("App constructed - loaded jQuery version " + $(document).jquery);
        fluid.kettle.node.loadApps(config, app, function() {
         // Mount shared directory points.
            fluid.engage.applyMountConfig(app, config.mount, baseDir);
            fluid.kettle.node.startServer(config, app);
        });
    };
    
    kettle.computeAbsMountsBoot(config.mount, baseDir);
    kettle.node.loadIncludes(includes, config, config.baseDir, kettle.node.initApp);

})();
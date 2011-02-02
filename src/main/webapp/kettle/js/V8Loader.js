(function() {

    var fs = require("fs");
    
    // Primordial, framework-free portion of Kettle
    var kettle = {
        node: {}
    };
    
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
    
    kettle.node.loadBootIncludes = function(includes) {
        for (var include in includes) {
            var path = includes[include];
            require.paths.push(path);
            require(include);
            console.log("Loaded " + include + " from path " + path);
        }  
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
    kettle.computeAbsMounts = function(mounts, baseDir) {
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
        kettle.computeAbsMounts(config.mount, baseDir);
        var i = 0;
        var loadNext = function() {
            var include = includes[i];
            var expanded = kettle.expandMountPath(config, baseDir, include);
            console.log("Loading script index " + i + " relative path " + include + " expanded path " + expanded);
            ++i;
            kettle.node.loadScript(expanded, i == includes.length? kettle.invokeLater(finalCallback) : loadNext);
        };
        loadNext();
    };
    
    var baseDir = kettle.node.getBaseDir();
    var includesPath = baseDir + "kettle/NodeBootstrapIncludes.json";
    var bootIncludes = kettle.node.readJSONFile(includesPath);
    // Load core framework dependencies required for Kettle (jsdom, etc.), which operate by CommonJS modules
    kettle.node.loadBootIncludes(bootIncludes); 

    // Process of "ClassLoader" juggling to bolt together our global "window", jsdom and XHR
    var jsdom = require("jsdom");
    var XMLHttpRequest = require("XMLHttpRequest");
    
    var document = jsdom.jsdom("<html><head></head><body>HELLO KETTOL WORLD</body></html>");
    var window = document.createWindow();
    window.require = require; // allow the module loader to be resolvable from inside the NEW WORLD
    window.__proto__.XMLHttpRequest = XMLHttpRequest; // allow xhr implementation to be seen from window
    var Context = process.binding('evals').Context;
    var global = window.__scriptContext = new Context(); // this is where it is mysteriously stashed by jsdom
    global.__proto__ = window;
    var fluid = global.fluid_1_3 = {
        kettle: {}
    };
    for (var key in kettle) { // copy in primordial contents of kettle namespace into the new world
        fluid.kettle[key] = kettle[key];
    }
    
    var config = kettle.node.readJSONFile(baseDir + "application/kettleConfig.json");
    var includes = kettle.node.readJSONFile(baseDir + config.includes);
    config.baseDir = baseDir;
    kettle.computeAbsMounts(config.mount, baseDir);

    
    kettle.node.initApp = function() {
        console.log("Framework includes loaded");
        if (config.debugMode) {
            fluid.setLogging(true);
        }
        var $ = global.jQuery;
        // The Fluid and Kettle frameworks have now loaded, dispatch into them to load applications and finally init server:
        var appStorage = {};
        var app = fluid.kettle.makeKettleApp(config, appStorage);
        console.log("Got app " + app);
        console.log("App constructed - jQuery version " + $(document).jquery);
        fluid.kettle.node.loadApps(config, app, function() {
         // Mount shared directory points.
            fluid.engage.applyMountConfig(app, config.mount, baseDir);
            fluid.kettle.node.startServer(config, app);
        });
    };
    
    kettle.node.loadIncludes(includes, config, config.baseDir, kettle.node.initApp);

})();
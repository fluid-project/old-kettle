/*
Copyright 2008-2010 University of Cambridge
Copyright 2008-2010 University of Toronto

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://source.fluidproject.org/svn/LICENSE.txt
*/

/*global jQuery*/
/*global fluid*/
/*global jqUnit*/


(function ($) {

    function injectScript(src, text) {
        var node = document.createElement("script");
        node.setAttribute("type", "text/javascript");
        if (src) {
            node.setAttribute("src", src);
        }
        if (text) {
            node.appendChild(document.createTextNode(text));
        }
        var head = document.getElementsByTagName("head")[0]; 
        head.appendChild(node);
    }

    function loadInclude(config, include) {
        for (var key in config.mount) {
            var mount = config.mount[key];
            if (include.indexOf(key) === 1) { 
                var resolved = "file://" + config.baseDir + mount.source + include.substring(key.length + 1);
                injectScript(resolved);
                return; 
            }
        }
        if (!(/env\.js|env2\.js/.test(include))) {
            var resolved = "file://" + config.baseDir + "kettle/" + include;
            injectScript(resolved);
        }
    }

    function loadIncludes(config, includes) {
        for (var i = 0; i < includes.length; ++ i) {
            loadInclude(config, includes[i]);
        }   
    }
    
    function loadEngageConfiguration() {    

        var baseDir = fluid.kettle.testUtils.determineBaseDir();
        var includesUrl = "file://" + baseDir + "kettle/kettleIncludes.json";
        var includesRet = fluid.kettle.operateUrl(includesUrl, JSON.parse, {async: false});

        var configUrl = "file://" + baseDir + "application/engageConfig.json";
        var configRet = fluid.kettle.operateUrl(configUrl, null, {async: false });
        injectScript(null, "var engageConfigJson=" + configRet.data + ";"); // do this since config file is not strict JSON
        var config = engageConfigJson;
        config.baseDir = baseDir;
   
        loadIncludes(config, includesRet.data);
        
        injectScript("../js/KettleTestUtils.js"); // override
        
        return config;
    }
    
    var config = loadEngageConfiguration();
    
      
    var EngageAppTests = new jqUnit.TestCase("Engage App JS Tests");

    window.setTimeout(function() {    
    EngageAppTests.test("Application tests", function() {
        var app = fluid.engage.initEngageApp(config);
        jqUnit.assertNotNull("App loaded", app);
        
        var response = fluid.kettle.makeRequest(app, "GET", "app/home.html");
        jqUnit.assertTrue("Successful request", response[0] === 200);
        jqUnit.assertTrue("Found init block in markup", response[2].indexOf("id=\"initBlock\"") !== -1);
      
    });
    }, 1);        
})(jQuery);


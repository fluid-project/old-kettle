fluid = fluid || {};
fluid.engage = fluid.engage || {};

(function () {
	
	fluid.engage.mountHandler = function (onApp, atSegment, handler) {
		fluid.engage.mountAcceptor(onApp, atSegment, {
			accept: function (segment, relPath, pathInfo) {
				return {
					handle: handler
				}
			}
		});
	};
	
	fluid.engage.mountAcceptor = function (onApp, atSegment, acceptor) {
		var acceptorMap = atSegment;
		if (typeof atSegment === "string") {
			acceptorMap = {};
			acceptorMap[atSegment] = acceptor;
		}

		for (var segment in acceptorMap) {
			onApp.root[segment] = {
				"*": acceptorMap[segment]
			};
		}
	};
	
	fluid.engage.initEngageApp = function (config) {
		var app = fluid.kettle.makeKettleApp(config.get("appName")),
		    serviceInits = config.get("initServices"),
		    baseDir = config.get("baseDir");
		
		// Initialize each of the Engage app services registered in the config file.
		fluid.setLogging(true);
		for (var i = 0; i < serviceInits.length; i++) {
			var initFn = serviceInits[i];
			fluid.log("Initializing service " + initFn);
			fluid.invokeGlobalFunction(initFn, [config, app]);
		}
		
		// Mount shared directory points.
		fluid.engage.mountAcceptor(app, {
	    	"infusion": fluid.kettle.mountDirectory(baseDir, "../../../infusion/"),
	    	"engage": fluid.kettle.mountDirectory(baseDir, "../../../engage/")
		});
		
		return app.app;
	};
})();

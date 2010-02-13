/*
Copyright 2009-2010 University of Toronto

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://source.fluidproject.org/svn/LICENSE.txt
*/

/*global jQuery, fluid*/

fluid = fluid || {};
fluid.codeEntry = fluid.codeEntry || {};

(function ($) {
    
    /**
     * Creates an url for the artifact view.
     * 
     * @param {Object} artifact, the artifact retrieved from CouchDB
     * @param dbName, the name of the database the artifact comes from
     */
    var compileTargetUrl = function (artifact, dbName, lang) {
        var baseArtifactUrl = "../artifacts/view.html";
        
        return baseArtifactUrl + "?" + $.param({accessNumber: artifact.artifactAccessionNumber, db: dbName, lang: lang});        
    };
    
    /**
     * Queries the database for the given object code and returns an object with
     * a field indicating whether the artifact was found and a link for the
     * artifact page if it was found.
     * 
     * @param {Object} config, Engage parsed config file.
     * @param {Object} params, URL parameters passed to this handler.
     */
    var getArtifactLink = function (config, params) {
        var artifact = {};
        
        var url = fluid.kettle.couchDBViewTemplate(config.viewURLTemplateWithKey, {
            dbName: params.db,
            view: config.views.byObjectCode,
            key: {
                objectCode: params.code,
                lang: params.lang
            }
        });
        
        var success = function (data) {
            // Workaround for '\n' character inserted at the end of the
            // returned data
            if (data.charAt(data.length - 1) === "\n") {
                data = data.substring(0, data.length - 1);
            }
        
            artifact = JSON.parse(data);
        };
        
        var error = function (XHR, textStatus, errorThrown) {
            fluid.log("XHR: " + XHR);
            fluid.log("Status: " + textStatus);
            fluid.log("Error: " + errorThrown);
        };
        
        $.ajax({
            url: url,
            async: false,
            success: success,
            error: error
        });
        
        if (artifact.rows.length > 0) {
            var mappedArtifact =  fluid.engage.mapModel(artifact.rows[0],
                    params.db);
            
            return compileTargetUrl(mappedArtifact, params.db, params.lang);
        }
    };
    
    /**
     * Creates an acceptor for code entry.
     * 
     *  @param {Object} config, the JSON config file for Engage.
     *  @param {Object} app, the Engage application.
     */
    fluid.codeEntry.initCodeEntryDataFeed = function (config, app) {
        var dataHandler = function (env) {
            var artifactLink = getArtifactLink(config, env.urlState.params);
            if (artifactLink) {
                return ["200", {"Content-Type": "text/plain"}, artifactLink];
            } else {
                return ["404", {"Content-Type": "text/plain"}, "NOT FOUND"];
            }
        };
        
        var acceptor = fluid.engage.makeAcceptorForResource("codeEntry", "json", dataHandler);
        fluid.engage.mountAcceptor(app, "artifacts", acceptor);
    };
    
    /**
     * Creates a producer for the code entry html.
     * 
     * @param {Object} config, the JSON config file for Engage.
     * @param {Object} app, the Engage application.
     */
    fluid.codeEntry.initCodeEntryService = function (config, app) {
        var renderHandlerConfig = {
            config: config,
            app: app,
            target: "artifacts/",
            source: "components/codeEntry/html/",
            sourceMountRelative: "engage",
            baseOptions: {
                renderOptions: {
                    cutpoints: [{selector: "#flc-initBlock", id: "initBlock"}]
                }
            }
        };
        
        var handler = fluid.engage.mountRenderHandler(renderHandlerConfig);
        
        handler.registerProducer("codeEntry", function (context, env) {
            var params = context.urlState.params;
            var strings = fluid.kettle.getBundle(renderHandlerConfig, params);
            var requestUri = env.REQUEST_URI.replace("html", "json");
                
            var options = {
                codeCheckUrlTemplate: requestUri + "?" + $.param({
                    db: params.db,
                    lang: params.lang,
                    code: "%objectCode"
                })
            };
            
            if (strings) {
                options.strings = strings;
            }
            
            var initBlock = {
                ID: "initBlock",
                functionname: "fluid.engage.codeEntry",
                "arguments": [".flc-codeEntry", options]
            };
            
            return initBlock;
        });            
    };    
})(jQuery);
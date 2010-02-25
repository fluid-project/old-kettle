/*
Copyright 2009 University of Cambridge
Copyright 2009 University of Toronto

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://source.fluidproject.org/svn/LICENSE.txt
*/

// Declare dependencies.
/*global jQuery, fluid*/
"use strict";

fluid = fluid || {};
fluid.myCollection = fluid.myCollection || {};

(function ($) {
    /**
     * Returns an URL for querying the museum databases for arfitacts.
     * 
     * @param {Object} config, the JSON config file for Engage.
     * @param database, the name of the museum database.
     * @param query, the query to perform.
     */
    var compileArtifactQueryURL = function (urlTemplate, view, database, query) {
        return fluid.stringTemplate(urlTemplate, {
            dbName: database || "", 
            view: view, 
            query: query || ""
        });
    };
    
    /**
     * Returns an object consisting of artifact arrays keyed by their museum.
     * 
     *  @param user, the user document from Couch
     */
    var groupArtifactsByMuseum = function (user) {
        var museums = {}; 
        if (!user.collection || !user.collection.artifacts) {
            return museums;
        }
        
        $.each(user.collection.artifacts, function (idx, artifact) {
            if (!museums[artifact.museum]) {
                museums[artifact.museum] = [];
            }
            museums[artifact.museum].push(artifact.id);
        });
        
        return museums;
    };
    
    /**
     * Returns an array of objects containing the database and the URL to query artifact data by.
     * 
     *  @param {Object} config, the JSON config file for Engage.
     *  @param user, the user document from Couch
     */
    var buildArtifactURLsByMuseum = function (urlTemplate, view, user) {
        var artifactsByMuseum = groupArtifactsByMuseum(user);
        var urlsByMuseum = [];
        
        // Go through the artifacts in each museum and compile up a giant OR query for Couch.
        for (var museum in artifactsByMuseum) {
            var artifacts = artifactsByMuseum[museum];            
            if (artifacts && artifacts.length > 0) {
                var query = "";
                for (var i = 0; i < artifacts.length; i++) {
                    query += artifacts[i];
                    if (i < artifacts.length - 1) {
                        query += encodeURIComponent(" OR ");
                    }
                }
                urlsByMuseum.push({
                    url: compileArtifactQueryURL(urlTemplate, view, museum, query),
                    museum: museum
                });
            }
        }
        
        return urlsByMuseum;
    };
    
    /**
     * Creates a nav-list friendly view of Artifacts.
     * 
     * @param {Object} data, the normalized artifact data.
     * @param dbName, the name of the museum database that contains the set of artifacts.
     * @param lang, the language selection.
     */
    var mapArtifactsToNavListModel = function (artifacts, dbName, lang) {
        var baseArtifactURL = "../artifacts/view.html";
        
        return fluid.transform(artifacts, function (artifact) {
            return {                
                id: artifact.id,
                artifactId: artifact.artifactId, // TODO: This is not actually part of the navigation list model
                target: baseArtifactURL + "?" +  $.param({
                    accessNumber: artifact.artifactAccessionNumber,
                    db: dbName,
                    lang: lang
                }),
                image: artifact.artifactImage,
                title: artifact.artifactTitle,
                description: artifact.artifactDate
            };
        });
    };
    
    /**
     * Performs a GET method via ajax to retrieve data from the database.
     * 
     * @param url, the url to call
     */
    var ajaxCall = function (url) {
        var data;
        
        var success = function (returnedData) {
            data = returnedData;
        };

        fluid.myCollection.common.ajaxCall(url, success, data, "GET");
        
        if (data) {
            return JSON.parse(data.replace("\n", ""));
        } else {
            return {};
        }
    };
    
    // This function does a mapping from a document returned by Lucene to
    // the standard document returned by the native couchdb view
    // TODO: This is completely hard-baked to McCord. 
    //       This whole function should be removed when we correctly refactor the model mapping code in Engage.js
    var preMap = function (document, database) {
        var artifact = document.artifact;
        var mappedModel = {
            id: document._id
        };
        var calculateMediaCount = function (mediafiles) {
            if (!mediafiles || !mediafiles.mediafile) {
                return "0";
            }
            var mediafile = mediafiles.mediafile;        
            return mediafile.length ? mediafile.length.toString() : "1";                
        };
        if (database === "mccord") {
            mappedModel.value = {
                'title': artifact.label.title || artifact.label.object,
                'artist': artifact.label.artist,
                'dated': artifact.label.dated,
                'medium': artifact.label.medium,
                'dimensions': artifact.label.dimensions,
                'mention': artifact.label.mention,
                'accessnumber': artifact.label.accessnumber,
                'description': artifact.description || "",
                'mediaCount': calculateMediaCount(artifact.mediafiles),
                'media': artifact.mediafiles ? artifact.mediafiles.mediafile || [] : [],
                'commentsCount': artifact.comments ? artifact.comments.cnt || "0" : "0",
                'comments': artifact.comments ? artifact.comments.comment || [] : [],
                'relatedArtifactsCount': artifact.related_artifacts ? artifact.related_artifacts.cnt || "0" : "0",
                'relatedArtifacts': artifact.related_artifacts ? artifact.related_artifacts.artifact || [] : [],
                'image': artifact.images ? artifact.images.image : [],
                'artifactId': artifact.id
            };
        }
        return mappedModel;
    };
    
    /**
     * Maps the model to standard JSON ids that will be passed to the client.
     * 
     * @param rawArtifactData, the raw data returned by CouchDB.
     * @param database, the museum database data is originating from.
     */
    var mapRawArtifacts = function (rawArtifactData, database) {
        var dataRows = rawArtifactData.rows || [];
        
        return fluid.transform(dataRows, function (row) {
            var artifact = preMap(row.doc, database);
            var mappedModel = fluid.engage.mapModel(artifact, database);
            mappedModel.artifactId = artifact.value.artifactId; // Another ugly walkaround that should be dealt with
            return mappedModel;
        });
    };
    
    /**
     *  Fetches data from Couch and returns a NavList-friendly array of artifact data.
     
     *  @param {Object} params, the parameters passed to the service.
     *  @param {Object} config, the JSON config file for Engage.
     */
    var fetchAndMapCollectedArtifacts = function (params, config) {
        var userID = params.user;
        if (!userID) {
            return [];
        }
        
        // TODO: Despite being called getCollection(), this function actually returns user documents.
        // TODO: We should replace this with the user dataSource defined in userService.
        var user = fluid.myCollection.common.getCollection(userID, config);
        var urls = buildArtifactURLsByMuseum(config.queryURLTemplate, config.views.artifactsByID, user);

        var collectedArtifacts = [];
        
        $.each(urls, function (idx, artifactQuery) {
            var rawArtifactData = ajaxCall(artifactQuery.url);
            var artifactData = mapRawArtifacts(rawArtifactData, artifactQuery.museum);
            var mappedArtifactsForMuseum = mapArtifactsToNavListModel(artifactData, artifactQuery.museum, params.lang);
            collectedArtifacts = collectedArtifacts.concat(mappedArtifactsForMuseum);
        });
        
        // My Collection displays artifact data in reverse order of collection--newest first, so flip the array around.
        return collectedArtifacts.reverse();
    };

    /**
     * Creates a handler for My Collection.
     * 
     *  @param {Object} config, the JSON config file for Engage.
     *  @param {Object} app, the Engage application. 
     */
    fluid.myCollection.initMyCollectionService = function (config, app) {
        var renderHandlerConfig = {
            config: config,
            app: app,
            target: "users/",
            source: "components/myCollection/html/",
            sourceMountRelative: "engage",
            baseOptions: {
                renderOptions: {
                    cutpoints: [{selector: "#flc-initBlock", id: "initBlock"}]
                }
            }
        };
        
        var handler = fluid.engage.mountRenderHandler(renderHandlerConfig);
        
        handler.registerProducer("myCollection", function (context, env) {
            var params = context.urlState.params;
            var collectedArtifacts = fetchAndMapCollectedArtifacts(params, config);
            var strings = fluid.kettle.getBundle(renderHandlerConfig, context.urlState.params) || {};
            var options = {
                model: collectedArtifacts,
                strings: strings
            };
                
            return {
                ID: "initBlock",
                functionname: "fluid.engage.myCollection",
                "arguments": [".flc-myCollection", options]
            };
        });
    };

})(jQuery);

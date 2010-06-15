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

fluid = fluid || {};
fluid.collectOperations = fluid.collectOperations || {};

(function ($) {
    
    var parsePathInfo = function (pathInfo) {
        // These bizarre "backwards" indices are workaround for a potential problem in Kettle's URL routing code.
        // Remember, this code is hard-baked for URLs that look like this:                
        //      users/[userUUID]/collection/[museumID]/artifacts/[artifactUUID]
        var length = pathInfo.length;
        return {
            users: pathInfo[length - 6],
            userUUID: pathInfo[length - 5],
            collection: pathInfo[length - 4],
            museumID: pathInfo[length -  3],
            artifacts: pathInfo[length - 2],
            artifactUUID: pathInfo[length - 1]
        };
    };
    
    /**
     * Extracts the artifact data from a restful path object.
     * 
     * @param {Object} pathInfo, the parsed path segments of the query URL.
     */
    var compileArtifactData = function (pathInfo) {
        var pathSegs = parsePathInfo(pathInfo);
        return {
            id: pathSegs.artifactUUID,
            museum: pathSegs.museumID,
            uuid: pathSegs.userUUID
        };
    };
    
    /**
     * Helper function for adding an artifact to a collection object.
     * @param {Object} userCollection, the user collection.
     * @param {Object} artifactData, the artifact object.
     */
    var addArtifact = function (userCollection, artifactData) {    
        userCollection.collection.artifacts.push({"museum": artifactData.museum, "id": artifactData.id});
    };
    
    /**
     * Helper function for removing an artifact from a collection object.
     * @param {Object} userCollection, the user collection.
     * @param {Object} artifactData, the artifact object.
     */
    var removeArtifact = function (userCollection, artifactData) {
        userCollection.collection.artifacts = $.makeArray(
            $(userCollection.collection.artifacts).filter(function () {
                return this.id !== artifactData.id;
            })
        );
    };
    
    /**
     * Collect/uncollect logic - the user collection is retreived from CouchDB and updated.
     * 
     * @param {Object} pathInfo, the parsed path segments of the query URL.
     * @param config, the JSON config file for Engage.
     * @param {Function} fn, alternatively the add/remove artifact function.
     */
    var collectOperation = function (pathInfo, config, fn) {
        var artifactData = compileArtifactData(pathInfo);
        
        var userCollection = fluid.myCollection.common.getCollection(artifactData.uuid, config);
        
        fn(userCollection, artifactData);
        
        var collectionUrl = fluid.myCollection.common.compileUserDocumentUrl(userCollection._id, config);
        
        fluid.myCollection.common.ajaxCall(collectionUrl, function () {}, JSON.stringify(userCollection), "PUT");       
    };
    
    var collectArtifact = function (pathInfo, config) {
        collectOperation(pathInfo, config, addArtifact);
    };
    
    var uncollectArtifact = function (pathInfo, config) {
        collectOperation(pathInfo, config, removeArtifact);
    };
    
    fluid.collectOperations.initAcceptor = function (config, app) {
        // Custom acceptor for collecting/uncollecting artifacts.
        // POST will collect the specified artifact into the user's personal collection; DELETE will uncollect
        fluid.engage.mountAcceptor(app, "users", {
            accept: function (segment, relPath, pathInfo, context) {
                var pathSegs = parsePathInfo(pathInfo.pathInfo);
                var method = context.method;
                
                // TODO: This is totally hard coded. A framework-wide solution to resource-oriented URL mounting is needed.
                if (pathSegs.artifacts !== "artifacts" || pathSegs.collection !== "collection" || pathSegs.users !== "users") {
                    return null;
                }
                
                var collectFn;
                var acceptor = {
                    handle: function (env) {
                        collectFn(env.urlState.pathInfo, config);
                        
                        return [200, {"Content-Type": "text/plain"}];
                    }
                };
                
                // TODO: This should really be replaced by framework-specific code for matching methods, ala makeAcceptorForResource()
                if (method === "POST") {
                    collectFn = collectArtifact;
                    return acceptor;
                } else if (method === "DELETE") {
                    collectFn = uncollectArtifact;
                    return acceptor;
                }
                
                return fluid.kettle.METHOD_NOT_ALLOWED;
            }
        });
    };
})(jQuery);

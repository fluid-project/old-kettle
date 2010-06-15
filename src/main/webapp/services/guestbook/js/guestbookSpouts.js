/*
Copyright 2009-2010 University of Toronto

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

(function ($) {
  
    fluid.engage.guestbook = fluid.engage.guestbook || {};
  
    fluid.engage.guestbook.recentMapper = function(model, directModel) {
        model.comments = model.comments || [];
        var comments = model.comments;
        var recent = directModel.recent;
        if (!recent || recent > comments.length) {
            return model;
        }
        else {
            comments.splice(recent, comments.length - recent);
        }
        return model;
    };
    
    fluid.engage.guestbook.demoDataSource = function() {
        return {
            get: function(directModel) {
                var demoPath = fluid.kettle.expandMountRelative("$engage/components/guestbook/data/demoData.json");
                // NB: Final version needs to source userid as well as correctly target comments onto artefact
                var data = fluid.kettle.operateUrl(demoPath, fluid.kettle.JSONParser);
                return data;          
            },
            put: function(model, directModel) {
                fluid.log("Received request to write " + JSON.stringify(model) + " at " + JSON.stringify(directModel));
            }
        };
    };
    
    fluid.engage.guestbook.mapper = function(model, directModel) {
        var togo = {};
        togo.comments = fluid.transform(model.rows, function(row) {
            return row.value;
        });
        togo = fluid.engage.guestbook.recentMapper(togo, directModel);
        togo.totalComments = model.rows.length;
        return togo;
    };
    
    fluid.engage.guestbook.dataSource = fluid.kettle.dataSource({
        source: {
            type: "fluid.kettle.URLDataSource",
            urlBuilder: {
                funcName: "fluid.kettle.couchDBViewBuilder",
                args:  {
                  baseUrl: "{config}.couchDBBaseUrl",
                  dbName: "${dbName}_comments",
                  design: "comments",
                  view: "comments",
                  keyList: ["type", "id", "date"],
                  startkeyExtend: {date: "9999"},
                  endkey: {type: "${type}",
                             id: "${id}"},
                  //limit: "${recent}",
                  descending: true
                  }
            }
        },
        outputMapper: "fluid.engage.guestbook.mapper"
    });
   
    fluid.engage.guestbook.docDataSource = fluid.kettle.dataSource({
        source: {
            type: "fluid.kettle.URLDataSource",
            writeable: true,
            urlBuilder: {
                funcName: "fluid.kettle.couchDBDocUrlBuilder",
                    args: {
                        baseUrl: "{config}.couchDBBaseUrl",
                        dbName: "${dbName}_comments",
                        docId: "${docId}"
                    }
            }
        }
    });
   
    /*
    fluid.engage.guestbook.dataSource = fluid.kettle.dataSource({
        source: {
            type: "fluid.engage.guestbook.demoDataSource"
        },
        outputMapper: "fluid.engage.guestbook.recentMapper"
    });
    */
        
    fluid.kettle.dataSpout({
        url: "guestbook/comments",
        contentType: "JSON",
        source: {name: "fluid.engage.guestbook.dataSource",
            args: [{recent: "{params}.recent"}]
        }
    });
    
    fluid.kettle.dataSpout({
        url: "guestbook/comment",
        contentType: "JSON",
        source: {name: "fluid.engage.guestbook.docDataSource",
            args: [{docId: "{params}.docId", dbName: "{params}.db"}]
        }
    });
    
    fluid.engage.guestbook.renderHandlerConfig = {
            target: "guestbook/",
            source: "components/guestbook/html/",
            sourceMountRelative: "engage",
            baseOptions: {
                renderOptions: {
                    cutpoints: [{selector: "#flc-initBlock", id: "initBlock"}]
                }
            }
        };
        
    function makeCommentPostURL(dbName) {
        return "../guestbook/comment.json?db="+dbName; // TODO: blatantly disgraceful hard-coded URL
    }
        
    fluid.engage.guestbook.makeOptions = function(directModel) {
         var data = fluid.engage.guestbook.dataSource.get(directModel);
         var strings = fluid.kettle.getBundle(fluid.engage.guestbook.renderHandlerConfig, directModel);
         if (!data.isError) {
             var options = {
                 model: data.data
                 };
             if (strings) {
                options.strings = strings;
             }
             var params = {
                 type: directModel.type,
                 id: directModel.id,
                 db: directModel.dbName,
                 lang: directModel.lang
             };
             options.addNoteTarget = "../guestbook/comment.html?" + $.param(params);
             options.postURL = makeCommentPostURL(directModel.dbName);
             options.locale = directModel.lang;
             return options;
         }
         else {
             return {
                 // TODO: somehow render the guestbook in an error or blank status (disabled?)
             };
         }
    };
    
    // lunacy whilst we continue to store each category of thing in its own database
    function targetDbToCommentsDb(dbName) {
        var _pos = dbName.indexOf("_");
        if (_pos === -1) {
            _pos = dbName.length;
        }
        return dbName.substring(0, _pos);
    }
    
    /** Construct a set of options suitable for embedding a guestbook in a foreign
     * component, given "directModel" */
     
    fluid.engage.guestbook.makeRemoteOptions = function(directModel) {
        directModel.dbName = targetDbToCommentsDb(directModel.dbName);
        var baseOptions = fluid.engage.guestbook.makeOptions(directModel);
        var templateUrl = fluid.kettle.expandMountRelative("$engage/components/guestbook/html/guestbook.html");
        var templateSource = fluid.kettle.fetchTemplateSection(templateUrl);
        baseOptions.templateSource = templateSource.isError? "" : templateSource.data;
        return {options: baseOptions};
    };
        
    fluid.kettle.markupSpout({
        renderHandlerConfig: fluid.engage.guestbook.renderHandlerConfig,
        producers: {
            "guestbook": function (context) {
                var params = context.urlState.params;
                var dbName = targetDbToCommentsDb(params.db);
                var options = fluid.engage.guestbook.makeOptions({dbName: dbName, lang: params.lang, recent: params.recent, type: params.type, id: params.id});
                if (!options.isError) {
                    return {tree: {
                        ID: "initBlock", 
                        functionname: "fluid.engage.guestbook", 
                        "arguments": [".flc-guestbook-container", options]
                    }};
                }
                return options;
            },
            "comment": function(context) {
                var params = context.urlState.params;
                var options = {};
                options.postURL = makeCommentPostURL(params.db);
                //options.userid = "anonymous";
                options.docRoot = {
                    type: "fluid.guestbook.comment",
                    authorName: "Anonymous CATT",
                    targetType: params.type,
                    targetId: params.id,
                 };
                options.strings = fluid.kettle.getBundle(fluid.engage.guestbook.renderHandlerConfig, params);
                return {tree: {
                    ID: "initBlock",
                    functionname: "fluid.engage.guestbookComment",
                    "arguments": [".flc-guestbook-container", options]
                }};
                
            }
        }
    });
})(jQuery);
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

    fluid.setLogging(true);
    
    // This code goes in FluidIoC.js once it is merged in
    var singleThreadLocal = {};
    
    fluid.singleThreadLocal = function() {
        return singleThreadLocal;
    };
    
    fluid.threadLocal = fluid.singleThreadLocal;
    
    fluid.identity = function() {
        if (arguments.length < 2) {
            return arguments[0];
        }
        else return $.makeArray(arguments);
    }

    // End FluidIoC material
    
    fluid.engage.endeaden = fluid.identity;
   
    
    fluid.kettle.testUtils = fluid.kettle.testUtils || {};
    fluid.kettle.testUtils.createMockEnv = function(method, url) {
        var togo = {};
        var path = url;
        var query;
        var qpos = url.indexOf("?");
        if (qpos !== -1) {
            path = url.substring(0, qpos);
            query = url.substring(qpos + 1);
        }
        togo.REQUEST_METHOD = method;
        togo.SCRIPT_NAME = path;
        togo.PATH_INFO = "/mount-point/" + path;

        if (query) {
            togo.QUERY_STRING = query;
        }
        return togo;
    };
    
    fluid.kettle.testUtils.makeRequest = function(app, method, url) {
        var env = fluid.kettle.testUtils.createMockEnv(method, url);
        return app(env);
    };
    
    fluid.kettle.testUtils.determineBaseDir = function() {
        var location = window.location.href.toString();
        var fpos = location.indexOf("//");
        var lpos = location.lastIndexOf("/");
        return location.substring(fpos + 2, lpos + 1) + "../../../";
    };
    
    var config = {
        baseDir: fluid.kettle.testUtils.determineBaseDir(),
        queryURLTemplate: "http://titan.atrc.utoronto.ca:5984/%dbName/_fti/lucene/%view?include_docs=true&q=%query",
        viewURLTemplate: "http://titan.atrc.utoronto.ca:5984/%dbName/%view",
        viewURLTemplateWithKey: "http://titan.atrc.utoronto.ca:5984/%dbName/%view?key=%key",
        
        views: {
            all: "all",
            byCollectionCategory: "by_collection_category",
            exhibitionByTitle: "_design/exhibitions/_view/view",
            catalogueByTitle: "_design/catalogue/_view/viewWithArtifacts",
            catalogueArtifacts: "_design/catalogueArtefacts/_view/view",
            exhibitions: "_design/exhibitions/_view/browse"
        },
        mount: {
            infusion: {
                target: "fluid-infusion/",
                source: "../../../../fluid-infusion/src/webapp/"
                },
            engage: {
                target: "fluid-engage-core/",
                source: "../../../../fluid-engage-core/"
                },
            engageDemo: {
                target: "engageDemo/",
                source: "services/engageDemo/"
              },
            kettleDemo: {
                target: "kettleDemo/",
                source: "services/kettleDemo/"
              }
            },
    };
    
    var remoteReturn = {
        data: {value: 34}
        };
    
    fluid.registerGlobalFunction("fluid.engage.exhibitionMapper", function(data) {
            if (remoteReturn.data) {
                jqUnit.assertDeepEq("Mapper supplied data", {value: 34}, data);
                return {value: 35}; 
            }
            else {
                jqUnit.fail("Mapper should not be called for invalid data");
            }
        });

    var KettleAppTests = new jqUnit.TestCase("Kettle App JS Tests");
    
    KettleAppTests.test("Application tests", function() {
              // Corrupt global namespace by creating mock
        fluid.kettle.getDataFromUrl = function(url) {
            jqUnit.assertEquals("Resolved URL", "http://titan.atrc.utoronto.ca:5984/mccord_exhibitions/_design/exhibitions/_view/browse", url);
            return remoteReturn;
        };
      
        var dataSource = fluid.kettle.makeDataSource({
            source: {
              type: "fluid.kettle.couchDBSource",
              urlBuilder: {
                  funcName: "fluid.stringTemplate",
                  args: ["{config}.viewURLTemplate", 
                    {
                      dbName: "${db}_exhibitions",
                      view: "{config}.views.exhibitions" 
                    }]
              }
            },
            outputMapper: "fluid.engage.exhibitionMapper"
        });
        fluid.registerGlobalFunction("fluid.engage.exhibitionDataSource", dataSource);
        
        fluid.kettle.dataSpout({
            url: "exhibitions/browse",
            contentType: "JSON",
            source: {name: "fluid.engage.exhibitionDataSource",
                args: [{db: "{params}.db"}]}
            });
        var app = fluid.engage.initEngageApp(config);
        
        var env = fluid.kettle.testUtils.createMockEnv("GET", "exhibitions/browse.json?db=mccord");
        var response = app(env);
        
        jqUnit.assertDeepEq("Processed response", [200, {"Content-type": fluid.kettle.contentTypeRegistry.JSON.contentTypeHeader},
           "{\"value\":35}"], response);
           
        remoteReturn = {
            isError: true,
            errorThrown: "Connection Timed out"
        };
        var response2 = app(env);
        jqUnit.assertEquals("Error response", 500, response2[0]);
        
        fluid.kettle.markupSpout({
            renderHandlerConfig: {
                target: "exhibitions/",
                source: "components/browse/html/",
                sourceMountRelative: "engage",
                baseOptions: {
                    renderOptions: {
                        cutpoints: [{selector: "#flc-initBlock", id: "initBlock"}]
                    }
                }
            },
            producers: {
                "browse": function (context, renderHandlerConfig) {
                      var params = context.urlState.params;
                      var data = fluid.engage.exhibitionDataSource.get({db: params.db});
                      if (!data.isError) {
                          return {tree: {
                              ID: "initBlock", 
                              functionname: "fluid.browse", 
                              "arguments": [".flc-browse", data.data.value]
                          }};
                      }
                      else return data;
                   }
                }
            });
            
        remoteReturn = {
            data: {value: 34}
        };
            
        var response = fluid.kettle.testUtils.makeRequest(app, "GET", "exhibitions/browse.html?db=mccord");
        jqUnit.assertEquals("Successful response", 200, response[0]);
        jqUnit.assertDeepEq("Markup content type", fluid.kettle.headerFromEntry(fluid.kettle.contentTypeRegistry.HTML), response[1]);
        var markup = response[2];
        jqUnit.assertTrue("Rendered data", markup.indexOf("fluid.browse(\".flc-browse\", 35)") !== -1);
    });
        
})(jQuery);
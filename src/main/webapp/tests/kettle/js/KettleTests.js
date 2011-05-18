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

    var mount = {
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
            source: "services/engageDemo/",
          },
        kettleDemo: {
            target: "kettleDemo/",
            source: "services/kettleDemo/",
          }
    };
    
    var renderHandlerConfig = {
        target: "home/",
        source: "components/home/html/",
        sourceMountRelative: "engage"
    }
    
    var config = {
        couchDBBaseUrl: "http://142.150.154.59:5984",
        queryURLTemplate: "http://titan.atrc.utoronto.ca:5984/%dbName/_fti/lucene/%view?include_docs=true&q=%query",
        viewURLTemplate: "http://titan.atrc.utoronto.ca:5984/%dbName/%view",
        viewURLTemplateWithKey: "http://titan.atrc.utoronto.ca:5984/%dbName/%view?key=%key",
        
        views: {
            all: "all",
            byCollectionCategory: "by_collection_category",
            exhibitionByTitle: "_design/exhibitions/_view/view",
            exhibitionsByID: "_design/exhibitions/_view/browseByID",
            artifactByAccession: {view: "_design/artifacts/_view/view", keyList: ["accessNumber", "lang"]},
            catalogueByTitle: "_design/catalogue/_view/viewWithArtifacts",
            catalogueArtifacts: "_design/catalogueArtefacts/_view/view",
            exhibitions: "_design/exhibitions/_view/browse"
        }
    };

    var KettleTests = new jqUnit.TestCase("Kettle JS Tests");

    KettleTests.test("URL Tests", function() {
      // Windows-style URL tests
        var baseUrl = "E:\\workspace\\fluid-engage-kettle\\src\\main\\webapp/";
        var rewBaseUrl = fluid.kettle.slashiseUrl(baseUrl);
        jqUnit.assertEquals("Deslash", "E:/workspace/fluid-engage-kettle/src/main/webapp/", rewBaseUrl);
        var infusionbase = fluid.kettle.parsePathInfo(fluid.kettle.slashiseUrl(baseUrl + mount.infusion.source));
        fluid.kettle.cononocolosePath(infusionbase.pathInfo);
        jqUnit.assertEquals("Canon", "E:/workspace/fluid-infusion/src/webapp/", fluid.kettle.collapseSegs(infusionbase.pathInfo, 0));
        var copyMount = fluid.copy(mount);
        fluid.kettle.computeAbsMounts(copyMount, rewBaseUrl);
        jqUnit.assertDeepEq("AbsMount", "E:/workspace/fluid-engage-core/", copyMount.engage.absSource);
        
        var rewriter = fluid.kettle.makeUrlRewriter(copyMount, renderHandlerConfig);
        jqUnit.assertEquals("Rewrite Long Mount", "../fluid-infusion/framework/fss/css/fss-mobile-layout.css", 
            rewriter("../../../../fluid-infusion/src/webapp/framework/fss/css/fss-mobile-layout.css"));
        jqUnit.assertEquals("Rewrite Short Mount", "components/home/css/Home.css", rewriter("../css/Home.css"));
        jqUnit.assertNull("Rewrite non-Mount", rewriter("../../../../../fluid-infusion"));
        
     // Unix-style URL tests   
        var baseUrl2 = "/private/var/folders/I3/I3gaY-IBGri5Uac95qFZ4++++TM/-Tmp-/Jetty_0_0_0_0_8080_fe.war__fe__qg2u39/webapp/";
        var rewBaseUrl2 = fluid.kettle.slashiseUrl(baseUrl2);
        jqUnit.assertEquals("Deslash idempotency", baseUrl2, rewBaseUrl2);
        var infusionbase2 = fluid.kettle.makeCanon(fluid.kettle.slashiseUrl(baseUrl2 + "fluid-infusion/"));
        jqUnit.assertEquals("Retain slash front", "/private/var/folders/I3/I3gaY-IBGri5Uac95qFZ4++++TM/-Tmp-/Jetty_0_0_0_0_8080_fe.war__fe__qg2u39/webapp/fluid-infusion/", infusionbase2);
        var file = fluid.kettle.pathToFileURL(infusionbase2);
        jqUnit.assertEquals("File triple slash", "file:///private/var/folders/I3/I3gaY-IBGri5Uac95qFZ4++++TM/-Tmp-/Jetty_0_0_0_0_8080_fe.war__fe__qg2u39/webapp/fluid-infusion/", file);
      
    });
    
    var renderHandlerConfig2 = {
        target: "kettleDemo/",
        source: "html/",
        sourceMountRelative: "kettleDemo"
    };
        
    var mount2 = {
        "kettleDemo": {
            "target": "kettleDemo/",
            "source": "services/kettleDemo"
            },
        "infusion": {
            "target": "fluid-infusion/",
            "source": "../../../../fluid-infusion/src/webapp/"
            }
        };
        
    KettleTests.test("URL Tests 2", function() {
        var baseUrl = "E:\\Source\\gits\\fluid-engage-kettle\\src\\main\\webapp/";
        var rewBaseUrl = fluid.kettle.slashiseUrl(baseUrl);
        var copyMount = fluid.copy(mount2);
        fluid.kettle.computeAbsMounts(copyMount, rewBaseUrl);
        var rewriter = fluid.kettle.makeUrlRewriter(copyMount, renderHandlerConfig2);
        
        var expected = { 
            "../images/Kettle-Icon_cropped.png": "images/Kettle-Icon_cropped.png",
            "../../../../../../../fluid-infusion/src/webapp/framework/fss/css/fss-text.css": "../fluid-infusion/framework/fss/css/fss-text.css"
        };
        
        fluid.each(expected, function(value, key) {
             jqUnit.assertEquals("Rewrite URL " + key, value, rewriter(key)); 
        });
    });
    
    KettleTests.test("Param tests", function() {
        var decode = fluid.kettle.decodeURIComponent("Jewish+Painters+of+Montreal%3A+Witnesses+of+Their+Time%2C+1930-1948");
        jqUnit.assertEquals("Deplussing, decoding", "Jewish Painters of Montreal: Witnesses of Their Time, 1930-1948", decode);
    });
    
    KettleTests.test("Couch URL Tests", function() {
        var encoded = fluid.kettle.couchDBViewTemplate(config.viewURLTemplateWithKey, {
                    dbName: "mccord_exhibitions",
                    view: config.views.exhibitionsByID,
                    key: "en"
                });
        jqUnit.assertEquals("Stringify quoting", 
           "http://titan.atrc.utoronto.ca:5984/mccord_exhibitions/_design/exhibitions/_view/browseByID?key=\"en\"", encoded);
        
        var encoded2 = fluid.kettle.couchDBViewTemplate(config.viewURLTemplateWithKey, {
                    dbName: "mccord_exhibitions",
                    view: config.views.artifactByAccession,
                    key: {lang: "en",
                          accessNumber: "II-43721",
                          }
                });
                
        jqUnit.assertEquals("Composite ordered encoding", 
           "http://titan.atrc.utoronto.ca:5984/mccord_exhibitions/_design/artifacts/_view/view?key={\"accessNumber\":\"II-43721\",\"lang\":\"en\"}", encoded2);
    
          
        var options = {
            baseUrl: config.couchDBBaseUrl,
            dbName: "mccord_comments",
            design: "comments",
            view: "comments",
            keyList: ["type", "id", "date"],
            startkey: {type: "exhibition",
                       id: "1"},
            endkeyExtend: {date: "9999"},
            limit: "2",
            descending: true
        };
        
        var encoded = fluid.kettle.couchDBViewBuilder(options);
        jqUnit.assertEquals("Couch builder", "http://142.150.154.59:5984/mccord_comments/_design/comments/_view/comments?startkey=%7B%22type%22%3A%22exhibition%22%2C%22id%22%3A%221%22%7D&endkey=%7B%22type%22%3A%22exhibition%22%2C%22id%22%3A%221%22%2C%22date%22%3A%229999%22%7D&limit=2&descending=true",
            encoded);
        
    });
 
    var dataSourceConfig = {
        source: {
            type: "fluid.kettle.URLDataSource",
            urlBuilder: {
                funcName: "fluid.stringTemplate",
                args: ["{config}.viewURLTemplate", 
                  {
                    dbName: "${{params}.db}_exhibitions",
                    view: "{config}.views.exhibitions" 
                  }]
            }
        },
        outputMapper: "fluid.engage.exhibitionMapper"
    };
    
    KettleTests.test("Environmental Tests", function() {
        var urlBuilder = {
            type: "fluid.stringTemplate",
            template: "{config}.viewURLTemplate", 
            mapper: {
                dbName: "${{params}.db}_exhibitions",
                view: "{config}.views.exhibitions" 
            }
        };
      
        fluid.kettle.withEnvironment({params: {db: "mccord"}, config: config},
           function() {
               var resolved = fluid.kettle.resolveEnvironment(urlBuilder);
               var required = {
                   type: "fluid.stringTemplate",
                   template: "http://titan.atrc.utoronto.ca:5984/%dbName/%view", 
                   mapper: {
                       dbName: "mccord_exhibitions",
                       view: "_design/exhibitions/_view/browse" 
                       }
                    };
               jqUnit.assertDeepEq("Resolved Environment", required, resolved);  
           });
        
        var dataSource = fluid.kettle.dataSource(dataSourceConfig);
        var remoteReturn = {
            data: 34
        };
        
        // Corrupt global namespace by creating mock
        fluid.kettle.operateUrl = function(url) {
            jqUnit.assertEquals("Resolved URL", "http://titan.atrc.utoronto.ca:5984/mccord_exhibitions/_design/exhibitions/_view/browse", url);
            return remoteReturn;
        };
        
        fluid.registerGlobalFunction("fluid.engage.exhibitionMapper", function(data) {
            if (remoteReturn.data) {
                jqUnit.assertEquals("Mapper supplied data", 34, data);
                return 35; 
            }
            else {
                jqUnit.fail("Mapper should not be called for invalid data");
            }
        });
        
        fluid.kettle.withEnvironment({params: {db: "mccord"}, config: config},
            function() {
                var returned = dataSource.get();
                jqUnit.assertDeepEq("Returned mapped data, 35", {data: 35}, returned);
                
                remoteReturn = {
                  isError: true
                };
                var returned2 = dataSource.get();
                jqUnit.assertDeepEq("Returned error return", {isError: true}, returned2);
            });
    });
    
        
})(jQuery);

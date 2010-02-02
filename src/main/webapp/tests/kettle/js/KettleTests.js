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
            rewriteSource: "../../../services/engageDemo/"
          },
        kettleDemo: {
            target: "kettleDemo/",
            source: "services/kettleDemo/",
            rewriteSource: "../../../services/kettleDemo/"
          }
    };
    
    var renderHandlerConfig = {
        target: "home/",
        source: "components/home/html/",
        sourceMountRelative: "engage"
    }
    
    var config = {
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
        }
    };
    
    // This code goes in FluidIoC.js once it is merged in
    var singleThreadLocal = {};
    
    fluid.singleThreadLocal = function() {
        return singleThreadLocal;
    };
    
    fluid.threadLocal = fluid.singleThreadLocal;
    
    var KettleTests = new jqUnit.TestCase("Kettle JS Tests");

    KettleTests.test("URL Tests", function() {
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
        jqUnit.assertEquals("Rewrite Short Mount", "../fluid-engage-core/components/home/css/Home.css", rewriter("../css/Home.css"));
        jqUnit.assertNull("Rewrite non-Mount", rewriter("../../../../../fluid-infusion"));
        
        
      
    });
 
    var dataSourceConfig = {
        source: {
            type: "fluid.kettle.couchDBSource",
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
        
        var dataSource = fluid.kettle.makeDataSource(dataSourceConfig);
        var remoteReturn = {
            data: 34
        };
        
        // Corrupt global namespace by creating mock
        fluid.kettle.getDataFromUrl = function(url) {
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

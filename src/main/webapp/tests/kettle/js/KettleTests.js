/*
Copyright 2008-2009 University of Cambridge
Copyright 2008-2009 University of Toronto
Copyright 2008-2009 University of California, Berkeley

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
        
        var rewriter = fluid.kettle.makeUrlRewriter(copyMount, rewBaseUrl, renderHandlerConfig);
        jqUnit.assertEquals("Rewrite Long Mount", "../fluid-infusion/framework/fss/css/fss-mobile-layout.css", 
            rewriter("../../../../fluid-infusion/src/webapp/framework/fss/css/fss-mobile-layout.css"));
        jqUnit.assertEquals("Rewrite Short Mount", "../fluid-engage-core/components/home/css/Home.css", rewriter("../css/Home.css"));
        jqUnit.assertNull("Rewrite non-Mount", rewriter("../../../../../fluid-infusion"));
    });
        
})(jQuery);

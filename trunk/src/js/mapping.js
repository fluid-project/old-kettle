/*
Copyright 2008-2009 University of Cambridge
Copyright 2008-2009 University of Toronto
Copyright 2007-2009 University of California, Berkeley

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://source.fluidproject.org/svn/LICENSE.txt
*/

// Declare dependencies.
/*global jQuery*/

var fluid_1_1 = fluid_1_1 || {};
var fluid = fluid || fluid_1_1;

(function ($, fluid) {
    fluid.mapping = fluid.mapping || {};
    
    function processDefaultTag(context) {
        // accrete any mixed content - probably an error
    }
    function processTagStart(context) {
    
    }
    
    fluid.mapping.parseXml = function(doc) {
      var togo = {};
      var stack = [togo];
      var parser = new XMLP(doc);
      var context = {
        togo: togo,
        stack: stack,
        parser: parser,
        defstart: -1,
        defend: -1
      };
      parseloop: while(true) {
      var iEvent = parser.next();
//        if (iEvent === XMLP._NONE) break parseloop;
//        continue;
     
      switch(iEvent) {
         case XMLP._ELM_B:
          processDefaultTag(context);
          //var text = parser.getContent().substr(parser.getContentBegin(), parser.getContentEnd() - parser.getContentBegin());
          processTagStart(context, false);
          break;
        case XMLP._ELM_E:
          processDefaultTag(context);
          processTagEnd(context);
          break;
        case XMLP._ELM_EMP:
          processDefaultTag();
          //var text = parser.getContent().substr(parser.getContentBegin(), parser.getContentEnd() - parser.getContentBegin());    
          processTagStart(context, true);
          break;
        case XMLP._PI:
        case XMLP._DTD:
          defstart = -1;
          continue; // not interested in reproducing these
        case XMLP._TEXT:
        case XMLP._ENTITY:
        case XMLP._CDATA:
        case XMLP._COMMENT:
          if (context.defstart === -1) {
            context.defstart = parser.m_cB;
            }
          context.defend = parser.m_cE;
          break;
        case XMLP._ERROR:
          fluid.setLogging(true);
          var message = "Error parsing template: " + parser.m_cAlt + " at line " + parser.getLineNumber(); 
          fluid.log(message);
          fluid.log("Just read: " + parser.m_xml.substring(parser.m_iP - 30, parser.m_iP));
          fluid.log("Still to read: " + parser.m_xml.substring(parser.m_iP, parser.m_iP + 30));
          fluid.fail(message);
          break parseloop;
        case XMLP._NONE:
          break parseloop;
        }
      }
      return togo;
    };
    
    fluid.mapping.loadFiles = function(files) {
       var specs = {};
       for (var i = 0; i < files.length; ++ i) {
           var file = files[i];
           var lasts = file.lastIndexOf('/');
           var key = file.substring(lasts + 1);
           var spec = {
              href: file
           };
           specs[key] = spec;
       }
       
       function parseSpecs(specs) {
           for (var key in specs) {
               var spec = specs[key];
               spec.data = parseXml(specs.resourceText);
           }
       }
       
       fluid.fetchResources(specs, parseSpecs);
       
    }
    
        
})(jQuery, fluid_1_1);
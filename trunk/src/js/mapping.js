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
    
    fluid.isEmpty = function (obj) {
        for (var i in obj) {
            return false;
        }
        return true;
    }
    
    var MARKER = {};
    
    function push(context, value) {
        var tagname = context.parser.getName();
        var length = context.stack.length;
        var top = context.stack[length - 1];
        var exist = top[tagname];
        if (!exist || fluid.isEmpty(exist)) {
            top[tagname] = value;
        }
        else {
            var elen = exist.length;
            if(typeof elen === "number" || value !== ""){
                if (typeof(elen) !== "number") {
                    exist = [exist];
                    top[tagname] = exist;
                    elen = 1;
                }
                if (typeof(value) === "string") {
                    exist[elen - 1].nodetext = value;
                }
                else {
                    exist[elen] = value;
                }
            }
        }
    }
    
    function processDefaultTag(context) {
        var parser = context.parser;
        var text = parser.m_xml.substr(parser.m_cB, parser.m_cE - parser.m_cB);
        context.text = $.trim(text);
    }
    
    function processTagStart(context, isempty) {
        var topush = fluid.copy(context.parser.m_attributes);
        push(context,topush);
        context.stack[context.stack.length] = topush;
        context.text = "";
        if (isempty) {
            --context.stack.length;
        }
    }
    function processTagEnd(context) {
    	  --context.stack.length;
    	  push(context, context.text);
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
        defend: -1,
        text: ""
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
          processDefaultTag(context);
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
    
    function writeOutput(message) {
        alert(message);
    }
    
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
           var times = 10;
           var time = new Date();
           var count = 0;
           for (var i = 0; i < times; ++ i) {
               count = 0;
               for (var key in specs) {
                   ++ count;
                   var spec = specs[key];
                   spec.data = fluid.mapping.parseXml(spec.resourceText);
               }
           }
           var delay = (new Date() - time);
           var usdelay = delay / ((times * count));
           writeOutput("Parsed " + (times * count) + " documents in " +  delay + "ms: " + usdelay + "ms per call");
 
       }
       
       fluid.fetchResources(specs, parseSpecs);
       
    }
    
        
})(jQuery, fluid_1_1);
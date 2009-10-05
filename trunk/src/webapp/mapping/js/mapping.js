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
/*global jQuery, fluid*/

var fluid = fluid || {};

(function ($, fluid) {
    fluid.mapping = fluid.mapping || {};
    
    fluid.isEmpty = function (obj) {
        for (var i in obj) {
            return false;
        }
        return true;
    }
    
    fluid.isServer = function() {
    	return /CATT/.test(navigator.userAgent);
    }
    
    var MARKER = {};
    
    function push(context, value) {
        var tagname = context.parser.m_name;
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
                    if (value !== "") {
                        exist[elen - 1].nodetext = value;
                    }
                }
                else {
                    exist[elen] = value;
                }
            }
        }
    }
    
    function processDefaultTag(context, text) {
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
    
    function makeContext(togo, parser) {
      return {
        togo: togo,
        stack: [togo],
        parser: parser,
        defstart: -1,
        defend: -1,
        text: ""
      };
    }
    
    function stripDec(doc) {
        var match = doc.match(/(^<\?.+\?>[\s]*)/);
        if (match) {
            doc = doc.substring( match[0].length);
        }
        return doc;
    }
    
    fluid.mapping.parseResig = function(doc) {
      var togo = {};
      var context = makeContext(togo, {});
      doc = stripDec(doc);
      var handler = {
        start: function(tag, attrs, unary) {
            context.parser.m_name = tag;
            context.parser.m_attributes = attrs;
            processTagStart(context, unary);
        },
        end: function(tag) {
            context.m_name = tag;
            processTagEnd(context);
        },
        chars: function(text) {
            processDefaultTag(context, text);
        }
      };
      var parser = HTMLParser(doc, handler);
      return togo;
    };
    
    fluid.mapping.parseXml = function(doc) {
      var togo = {};
      var parser = new XMLP(doc);
      var context = makeContext(togo, parser);

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
          var text = parser.m_xml.substr(parser.m_cB, parser.m_cE - parser.m_cB);
          processDefaultTag(context, text);
          processTagEnd(context);
          break;
        case XMLP._ELM_EMP:
          processDefaultTag(context);
          //var text = parser.getContent().substr(parser.getContentBegin(), parser.getContentEnd() - parser.getContentBegin());    
          processTagStart(context, true);
          break;
        case XMLP._PI:
        case XMLP._DTD:
          context.defstart = -1;
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
    
    fluid.mapping.parseDom = function(dom) {
      var togo = {};
      var context = makeContext(togo, {});
      
      function parseNode(dom) {
         context.parser.m_name = dom.tagName;
         var attrs = {};
         if (dom.attributes) {
             for (var i = 0; i < dom.attributes.length; ++ i) {
                 var name = dom.attributes[i].name;
                 var value = dom.attributes[i].value;
                 if (name && value) {
                   attrs[name] = value;
                 }
             }
         }
         context.parser.m_attributes = attrs;
         processTagStart(context, false);
         var children = dom.childNodes;
         for (var i = 0; i < children.length; ++ i) {
             var node = dom.childNodes[i];
             if (node.nodeType === 1) {
                 parseNode(node);
             }
             else if (node.nodeType === 3 || node.nodeType === 4) {
                 processDefaultTag(context, node.nodeValue);
             }
         }
         context.parser.m_name = dom.tagName;
         processTagEnd(context);
         context.text = "";
      }
      
      parseNode(dom);
      return togo;
    };
    
    fluid.mapping.parseFrank = function(doc) {
       var togo = xml2json.parser(doc);
       return togo;
    };
    
    fluid.mapping.parseYusuke = function(doc) {
    	var parser = new JKL.ParseXML();
    	var togo = parser.parseDocument(doc);
    	return togo;
    }
    
    function writeOutput(message) {
    	  if (fluid.isServer()) {
    	  	java.lang.System.out.println(message);
    	  }
    	  else {
          $("#render-root").append(message + "<br/>");
    	  }
    }
    
    function makeSpecs(files, getDom) {
       var specs = {};
       for (var i = 0; i < files.length; ++ i) {
           var file = files[i];
           var lasts = file.lastIndexOf('/');
           var key = file.substring(lasts + 1);
           var spec = {
              href: file
           };
           spec.options = {
               dataType: getDom? "xml" : "text"
           };
           specs[key] = spec;
       }
       return specs;  
    }
    
    fluid.mapping.loadFiles = function(files) {

       
       function timeSpecs(specs, func, times) {
           var time = new Date();
           var count = 0;
           for (var i = 0; i < times; ++ i) {
               count = 0;
               for (var key in specs) {
                   ++ count;
                   var spec = specs[key];
                   if (spec.fetchError) {
                       writeOutput("Error fetching file at " + spec.href + ": " + spec.fetchError.errorThrown);
                       fluid.fail("Error fetching file");
                   }
                   spec.data = fluid.invokeGlobalFunction(func, [spec.resourceText]);
               }
           }
           var delay = (new Date() - time);
           var usdelay = delay / ((times * count));
           writeOutput(func + " parsed " + (times * count) + " documents in " +  delay + "ms: " + usdelay + "ms per call");
            
       }
       
       function parseSpecs(specs) {
           timeSpecs(specs, "fluid.mapping.parseXml", 10);
           timeSpecs(specs, "fluid.mapping.parseResig", 1);
           timeSpecs(specs, "fluid.mapping.parseFrank", 1);
       }
       
       function parseSpecs2(specs) {
           timeSpecs(specs, "fluid.mapping.parseDom", 10);
           timeSpecs(specs, "fluid.mapping.parseYusuke", 10);
       }
       
       fluid.fetchResources(makeSpecs(files), parseSpecs);
       
       if (!fluid.isServer()) {
         fluid.fetchResources(makeSpecs(files, true), parseSpecs2);
       }
    }
    
        
})(jQuery, fluid);
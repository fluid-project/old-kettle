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

var fluid_1_2 = fluid_1_2 || {};
var fluid = fluid || fluid_1_2;

(function ($, fluid) {
    
    fluid.dom = fluid.dom || {};
    
    fluid.dom.evalScripts = function (node) {
    	  if (!node) {
    	      node = document;
    	  }
        if ( node.nodeName == "SCRIPT" ) {
          if ( !node.getAttribute("src") ) {
            eval.call( window, node.textContent );
          }
        } else {
          var scripts = node.getElementsByTagName("script");
          for ( var i = 0; i < scripts.length; i++ ) {
            fluid.dom.evalScripts(scripts[i]);
          }
        }    	
    }
    
    window.console = {
        debug: function(message) {
            java.lang.System.out.println(message);
        }
    };
    
    $.ajaxSettings.async = false;
})(jQuery, fluid_1_2);
    
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

var fluid_1_2 = fluid_1_2 || {};
var fluid = fluid || fluid_1_2;

(function ($, fluid) {
    fluid.kettleDemo = fluid.kettleDemo || {};
    
    fluid.kettleDemo.app = function(env) {
        return [200,{"Content-Type":"text/plain"}, "THE KETTOL HAS LANDED!" ];
}
    
})(jQuery, fluid_1_2);
/*
Copyright 2009 University of Toronto

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://source.fluidproject.org/svn/LICENSE.txt
*/

/*global jQuery, demo*/

var demo = demo || {};

demo.updateAmpersands = function () {
	jQuery("li > a").each(function (i, value) {
		var link = jQuery(value).attr("href");
		jQuery(value).attr({"href": link.replace(/%26/g, "&")});
	});
};
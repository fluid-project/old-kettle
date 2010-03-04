/*
Copyright 2009-2010 University of Toronto

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://source.fluidproject.org/svn/LICENSE.txt
*/

// Declare dependencies.
/*global jQuery, fluid*/
"use strict";

fluid = fluid || {};

(function ($) {
  
    fluid.engage.condenser = fluid.engage.condenser || {};
    
    fluid.engage.trundle = function(state, front, end, frontShove) {
       if (state.start === undefined) {
           state.start = 0;
       }
       if (state.end === undefined) {
           state.end = state.string.length;
       }
       var f1 = state.string.indexOf(front, state.start);
       var f2 = state.string.indexOf(end, state.start + front.length);
       if (f1 === -1 || f2 === -1 || f1 > state.end || f2 > state.end) {
           return null;
       }
       else {
           if (frontShove) {
               var f3 = state.string.indexOf(frontShove, f1 + front.length);
               f1 = f3 + frontShove.length;
           }
           else {
               f2 += end.length;
           }
           var togo = {
               string: state.string,
               start: f1,
               end: f2,
           };
           togo.get = function() { return togo.string.substring(togo.start, togo.end);}
           return togo;
       }
    };
    
    fluid.engage.multiTrundle = function(state, front, end) {
        state = fluid.copy(state);
        var togo = [];
        while (true) {
            var next = fluid.engage.trundle(state, front, end);
            if (next) {
                togo.push(next.get());
                state.start = next.end;
            }
            else return togo;
        }
    };
    
    function bodyToDiv(body) {
        return "<div" + body.substring(5, body.length - 6) + "</div>";
    }
    
    fluid.engage.condenser.parseMarkup = function(markup) {
        var rootState = {string: markup, start: 0, end: markup.length};
        var headState = fluid.engage.trundle(rootState, "<head", "</head", ">");
        var bodyState = fluid.engage.trundle({string: markup, start: headState.end}, "<body", "</body");
        var linkTags = fluid.engage.multiTrundle(headState, "<link", "</link>");
        var scriptTags = fluid.engage.multiTrundle(headState, "<script", "</script>");
        var body = bodyToDiv(bodyState.get());

        return {
            body: body,
            linkTags: linkTags,
            scriptTags: scriptTags
        };
    };
    
    fluid.engage.condenser.renderHandlerConfig = {
        target: "mobileHome/",
        source: "components/mobileHome/html/",
        sourceMountRelative: "engage",
        baseOptions: {
            renderOptions: {
                cutpoints: [{selector: "#flc-initBlock", id: "initBlock"}]
            }
        }
    };
    
    fluid.kettle.markupSpout({
        renderHandlerConfig: fluid.engage.condenser.renderHandlerConfig,
        producers: {
          "mobileHome": function(context) {
            var initBlock = {ID: "initBlock", functionname: "fluid.engage.screenNavigator", 
                "arguments": [".flc-navigator-portal", {initialUrl: "home/home.html", condenser: "../condenser/condense.json"}]};
                        
            return {tree: initBlock};
            }
        }
    });
    
    
    fluid.engage.condenser.dataSource = {
        get: function(directModel) {
            var app = fluid.kettle.resolveEnvironment("{appStorage}.appHolder");
            var targetUrl = fluid.kettle.addParamsToUrl(directModel.targetUrl, {urlRewriter: "condenser"});
            //var params = fluid.kettle.resolveEnvironment("{params}");
            var response = fluid.kettle.makeRequest(app.app, "GET", directModel.targetUrl);
            var markup = response[2]; // TODO: JSGI upgrade // TODO: deal with error return
            return {data: fluid.engage.condenser.parseMarkup(markup)};
        }
    };
    
    fluid.kettle.dataSpout({
        url: "condenser/condense",
        contentType: "JSON",
        source: {name: "fluid.engage.condenser.dataSource",
            args: [{targetUrl: "{params}.targetUrl"}]
        }
    });
        
    fluid.engage.condenserInitialiser = function(config, app, appStorage) {
        var urlRewriter = fluid.kettle.makeUrlRewriter(config.mount, fluid.engage.mobileHome.renderHandlerConfig);
        appStorage.condenser = {
            urlRewriter: urlRewriter
        };
    };
})(jQuery);
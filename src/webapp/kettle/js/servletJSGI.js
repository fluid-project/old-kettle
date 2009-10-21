/**
* Portions of this software are covered under the following license:
*
* Copyright (c) 2009 Thomas Robinson <tlrobinson.net>
*
* Permission is hereby granted, free of charge, to any person obtaining a copy of 
* this software and associated documentation files (the “Software”), to deal in 
* the Software without restriction, including without limitation the rights to 
* use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies 
* of the Software, and to permit persons to whom the Software is furnished to 
* do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all 
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
* AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN 
* ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION 
* WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
* 
* ------
* 
* Other portions, contributed by the Fluid community, are covered under the following license:
* 
* Copyright 2009 University of Cambridge
*
* Licensed under the Educational Community License (ECL), Version 2.0 or the New
* BSD license. You may not use this file except in compliance with one these
* Licenses.
*
* You may obtain a copy of the ECL 2.0 License and BSD License at
* https://source.fluidproject.org/svn/LICENSE.txt
*/

/*global jQuery, fluid, Packages*/

fluid = fluid || {};


// Adapted from JackJS' (http://jackjs.org/) servlet.js "handler" - original comment:

// Similar in structure to Rack's Mongrel handler.
// All generic Java servlet code should go in here.
// Specific server code should go in separate handlers (i.e. jetty.js, etc)


(function ($, fluid) {
    fluid.kettle = fluid.kettle || {};
    fluid.kettle.servlet = fluid.kettle.servlet || {};

    fluid.kettle.servlet.process = function (app, request, response) {
        var env = {};
        var key;  
        // copy HTTP headers over, converting where appropriate
        for (var e = request.getHeaderNames(); e.hasMoreElements();) {
            var name = String(e.nextElement()),
                value = String(request.getHeader(name)); // FIXME: only gets the first of multiple
            
            key = name.replace("-", "_").toUpperCase();
              
            if (key !== "CONTENT_LENGTH" && key !== "CONTENT_TYPE") {
                key = "HTTP_" + key;
            }  
            env[key] = value;
        }
          
        env.SCRIPT_NAME          = String(request.getServletPath() || "");
        env.PATH_INFO            = String(request.getRequestURI() || "");
          
        env.REQUEST_METHOD       = String(request.getMethod() || "");
        env.SERVER_NAME          = String(request.getServerName() || "");
        env.SERVER_PORT          = String(request.getServerPort() || "");
        env.QUERY_STRING         = String(request.getQueryString() || "");
        env.HTTP_VERSION         = String(request.getProtocol() || "");
          
        env.REMOTE_HOST          = String(request.getRemoteHost() || "");
          
        // not part of the formal spec
        env.REQUEST_URI          = String(request.getRequestURL() || "");
              
        // call the app
        var result = app(env),
            status = result[0], headers = result[1], body = result[2];
          
        // set the status
        response.setStatus(status);
          
        // set the headers
        for (key in headers) {
            if (headers.hasOwnProperty(key)) {
                fluid.transform(headers[key].split("\n"), function (value) {
                    response.addHeader(key, value);
                });
            }
        }
      
        Packages.org.fluidproject.kettle.ResourceUtil.sendResponse(response, body);
    };

})(jQuery, fluid);
    

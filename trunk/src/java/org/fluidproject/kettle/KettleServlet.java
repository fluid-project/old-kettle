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

package org.fluidproject.kettle;

import java.util.Map;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.mozilla.javascript.Function;

/**
 * The root handler servlet for the Kettle framework. Taken with thanks and
 * adapted from "JackServlet". 
 * http://github.com/tlrobinson/jack-servlet/blob/master/src/org/jackjs/JackServlet.java
 * 
 */

public class KettleServlet extends HttpServlet {
    private RhinoLoader loader;
    private Function app;
    private Function handler;
    
    private void assertKeys(String path, Map map, String[] keys) {
        for (int i = 0; i < keys.length; ++ i) {
            if (map.get(keys[i]) == null) {
                throw new IllegalArgumentException("Error in configuration file at path " + path + 
                        ", required key \"" + keys[i] + "\" not found");
            }
        }
    }

    public void init(ServletConfig config) throws ServletException {
        super.init(config);
        String kettleLocation = getInitParam(config, "kettleConfigLocation", "/WEB-INF/kettleDemo.json");
        ServletContext context = getServletContext();
        String kettlePath = context.getRealPath(kettleLocation);
        Map kettleConfig = ResourceUtil.loadJson(kettlePath);
        kettleConfig.put("appName", config.getServletName());
        assertKeys(kettlePath, kettleConfig, new String[] {"includes", "handlerFunction"});
        String contextPath = context.getRealPath("/") + "/";
        kettleConfig.put("baseDir", contextPath);
        loader = new RhinoLoader(ResourceUtil.booleanValue(kettleConfig.get("debugMode")));
        String includes = (String) kettleConfig.get("includes");
        String includesPrefix = (String) kettleConfig.get("includesPrefix");
        if (includesPrefix == null) includesPrefix = "";
        loader.setDocument(ResourceUtil.pathToFileUrl(contextPath + "kettle/root.xml"));
        loader.loadJSONFiles(contextPath, includes, includesPrefix, (Map) kettleConfig.get("mount"));

        // load Servlet handler "process" method
        handler = loader.getFunction(kettleConfig.get("handlerFunction"));
 
        // load the app
        Object appFunction = kettleConfig.get("appFunction");
        Object loaderFunction = kettleConfig.get("loaderFunction");
        if (appFunction == null && loaderFunction == null) {
            throw new IllegalArgumentException("One of appFunction and loaderFunction must be defined");
        }
        if (appFunction != null) {
            app = loader.getFunction(appFunction);
        }
        else {
            Function loaderFunc = loader.getFunction(loaderFunction);
            Object funcret = loader.invokeFunction(loaderFunc, new Object[] {kettleConfig});
            if (!(funcret instanceof Function)) {
                throw new IllegalArgumentException("loaderFunction needs to return an app function");
            }
            app = (Function) funcret;
        }
    }

    public void service(HttpServletRequest request, HttpServletResponse response) {
        loader.invokeFunction(handler, new Object[] { app, request, response });
    }

    private String getInitParam(ServletConfig config, String name, String defaultValue) {
        String value = config.getInitParameter(name);
        return value == null ? defaultValue : value;
    }
}

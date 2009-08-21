/*
 * Created on 19 Jun 2009
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
 * 
 * @author Antranig Basman (amb26@ponder.org.uk)
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
// Bug 1 - DeJSON does not recognise boolean
        loader = new RhinoLoader(kettleConfig.get("debugMode").equals("true"));
        String includes = (String) kettleConfig.get("includes");
        String includesPrefix = (String) kettleConfig.get("includesPrefix");
        if (includesPrefix == null) includesPrefix = "";
        loader.setDocument(ResourceUtil.pathToFileUrl(contextPath + "kettle/root.xml"));
        loader.loadJSONFiles(contextPath + includesPrefix, contextPath + includes);

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

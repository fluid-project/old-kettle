/*
 * Created on 19 Jun 2009
 */
package org.fluidproject.kettle;

import java.util.Map;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;

/**
 * The root handler servlet for the Kettle framework. Taken with thanks and
 * adapted from "JackServlet".
 * 
 * @author Antranig Basman (amb26@ponder.org.uk)
 * 
 */

public class KettleServlet extends HttpServlet {
    private RhinoLoader loader;
    private Scriptable scope;
    private Function app;
    private Function handler;

    public void init(ServletConfig config) throws ServletException {
        super.init(config);
        String kettleLocation = getInitParam(config, "kettleConfigLocation", "/WEB-INF/kettleDemo.json");
        String kettlePath = getServletContext().getRealPath(kettleLocation);
        Map kettleConfig = RhinoLoader.loadJson(kettlePath);

        loader = new RhinoLoader(kettleConfig.get("debugMode") == Boolean.TRUE);
        loader.loadJSONFiles((String) kettleConfig.get("includesPrefix"), (String) kettleConfig.get("includes"));

        // load Servlet handler "process" method
        handler = (Function) loader.evaluateString((String) kettleConfig.get("handler"));

        // load the app
        app = (Function) loader.evaluateString((String) kettleConfig.get("app"));
    }

    public void service(HttpServletRequest request, HttpServletResponse response) {
        Context context = Context.enter();
        try {
            Object args[] = { app, request, response };
            handler.call(context, scope, null, args);
        }
        finally {
            Context.exit();
        }
    }

    private String getInitParam(ServletConfig config, String name, String defaultValue) {
        String value = config.getInitParameter(name);
        return value == null ? defaultValue
                : value;
    }
}

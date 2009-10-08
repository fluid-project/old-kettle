/*
 * Created on 19 Jun 2009
 */
package org.fluidproject.engage;

import org.fluidproject.kettle.RhinoLoader;

/**
 * Loads the Rhino environment, with or without debugger, to run the
 * various Javascript XML to JSON conversion tasks in mapping.html on the
 * server.
 * 
 * @author Antranig Basman (amb26@ponder.org.uk)
 *
 */

public class EngageRhinoLoader {
    public static void main(String[] args) {
        RhinoLoader loader = new RhinoLoader(args.length > 0 && args[0].equals("debug"));

        loader.setDocument("src/webapp/mapping/html/mapping.html");
        loader.loadJSONFiles("", "src/webapp/mapping/html/", "src/java/org/fluidproject/engage/XMLtoJSONincludes.json", null);
        loader.evaluateString("fluid.dom.evalScripts()");
        
      }
}

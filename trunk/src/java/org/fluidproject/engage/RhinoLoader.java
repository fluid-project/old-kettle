/*
 * Created on 17 Jun 2009
 */
package org.fluidproject.engage;

import java.io.FileInputStream;
import java.io.FileReader;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.ScriptableObject;


import uk.org.ponder.json.support.DeJSONalizer;
import uk.org.ponder.saxalizer.SAXalizerMappingContext;
import uk.org.ponder.util.UniversalRuntimeException;

public class RhinoLoader {

  public static String[] loadJsonArray(String filename) {
    try {
      FileInputStream fis = new FileInputStream(filename);
      DeJSONalizer de = new DeJSONalizer(SAXalizerMappingContext.instance(), fis);
      return (String[]) de.readObject(new String[] {}, null);
    }
    catch (Exception e) {
      throw UniversalRuntimeException.accumulate(e);
    }
  }

  private Context context;
  private ScriptableObject shell;
  private boolean envLoaded = false;
  private String docpath = null;
  
  private DebuggerLoader debuggerLoader;

  public RhinoLoader(boolean debug) {
    shell = new ScriptableObject() {
      public String getClassName() {
        return "RhinoLoader";
      }
    };
    if (debug) {
      debuggerLoader = new DebuggerLoader("RhinoLoader debugger", shell);
    }
    context = Context.enter();
    context.initStandardObjects(shell);

  }

  public void loadFile(String filename) {
    try {
      FileReader fr = new FileReader(filename);
     // if (debuggerLoader != null) {
     //   debuggerLoader.loadFile(filename, fr);
     // }
     // else {
        context.evaluateReader(shell, fr, filename, 1, null);
     // }
      if (filename.endsWith("env.js") && docpath != null) {
        envLoaded = true;
        setDocument(this.docpath);
      }
    }
    catch (Exception e) {
      throw UniversalRuntimeException.accumulate(e);
    }
  }
  
  public void setDocument(String docpath) {
    if (envLoaded) {
      context.evaluateString(shell, "window.location = \"" + docpath + "\"", null, 1, null);
    }
    else this.docpath = docpath;
  }

  private static final String dir = "src/html/";
  
  public static void main(String[] args) {

    String[] files = loadJsonArray("src/java/org/fluidproject/engage/XMLtoJSONincludes.json");
    RhinoLoader loader = new RhinoLoader(args.length > 0 && args[0].equals("debug"));

    loader.setDocument("src/html/root.xml");
    
    for (int i = 0; i < files.length; ++ i) {
      loader.loadFile(dir + files[i]);
      if (files[i].endsWith("env.js")) {
      }
    }
  }
}

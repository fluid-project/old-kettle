/*
 * Created on 17 Jun 2009
 */
package org.fluidproject.engage;

import java.io.FileInputStream;
import java.io.FileReader;

import sun.org.mozilla.javascript.internal.Context;
import sun.org.mozilla.javascript.internal.ScriptableObject;
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

  public RhinoLoader() {
    context = Context.enter();
     shell = new ScriptableObject() {
      public String getClassName() {
        return "RhinoLoader";
      }
    };
    context.initStandardObjects(shell);
  }

  public void loadFile(String filename) {
    try {
      FileReader fr = new FileReader(filename);
      context.evaluateReader(shell, fr, filename, 1, null);
    }
    catch (Exception e) {
      throw UniversalRuntimeException.accumulate(e);
    }
  }

  private static final String dir = "src/html/";
  
  public static void main(String[] args) {

    String[] files = loadJsonArray("src/java/org/fluidproject/engage/XMLtoJSONincludes.json");
    RhinoLoader loader = new RhinoLoader();
    
    for (int i = 0; i < files.length; ++ i) {
      loader.loadFile(dir + files[i]);
    }
  }
}

/*
 * Created on 17 Jun 2009
 */
package org.fluidproject.kettle;

import java.io.FileInputStream;
import java.io.FileReader;
import java.util.HashMap;
import java.util.Map;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.ScriptableObject;

import uk.org.ponder.json.support.DeJSONalizer;
import uk.org.ponder.saxalizer.SAXalizerMappingContext;
import uk.org.ponder.util.UniversalRuntimeException;

public class RhinoLoader {

    private static Object readJson(String filename, Object root) {
        try {
            FileInputStream fis = new FileInputStream(filename);
            DeJSONalizer de = new DeJSONalizer(SAXalizerMappingContext.instance(), fis);
            return de.readObject(root, null);
        }
        catch (Exception e) {
            throw UniversalRuntimeException.accumulate(e);
        }        
    }
    
    public static String[] loadJsonArray(String filename) {
        return (String[]) readJson(filename, new String[] {});
    }
    
    public static Map loadJson(String filename) {
        return (Map) readJson(filename, new HashMap());
    }

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
        Context context = Context.enter();
        context.initStandardObjects(shell);
        Context.exit();
    }

    public void loadFile(String filename) {
        try {
            FileReader fr = new FileReader(filename);
            Context context = Context.enter();
            context.evaluateReader(shell, fr, filename, 1, null);
            if (filename.endsWith("env.js") && docpath != null) {
                envLoaded = true;
                setDocument(this.docpath);
            }
        }
        catch (Exception e) {
            throw UniversalRuntimeException.accumulate(e);
        }
        finally {
            Context.exit();
        }
    }

    public void setDocument(String docpath) {
        if (envLoaded) {
            evaluateString("window.location = \"" + docpath + "\"");
        }
        else
            this.docpath = docpath;
    }

    public Object evaluateString(String toEvaluate) {
        Context context = Context.enter();
        try {
            return context.evaluateString(shell, toEvaluate, null, 1, null);
        }
        finally {
            Context.exit();
        }
    }

    private void markLoaded() {
        if (debuggerLoader != null) {
            debuggerLoader.doBreak();
        }
    }

    public void loadJSONFiles(String prefix, String path) {
        String[] files = loadJsonArray(path);
        for (int i = 0; i < files.length; ++i) {
            loadFile(prefix + files[i]);
        }
        markLoaded();
    }

}

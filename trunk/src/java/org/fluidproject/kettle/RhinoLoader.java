/*
 * Created on 17 Jun 2009
 */
package org.fluidproject.kettle;

import java.io.FileReader;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.ScriptableObject;

import uk.org.ponder.util.UniversalRuntimeException;

public class RhinoLoader {

    private ScriptableObject scope;
    private boolean envLoaded = false;
    private String docpath = null;

    private DebuggerLoader debuggerLoader;

    public RhinoLoader(boolean debug) {
        scope = new ScriptableObject() {
            public String getClassName() {
                return "RhinoLoader";
            }
        };
        if (debug) {
            debuggerLoader = new DebuggerLoader("RhinoLoader debugger", scope);
        }
        Context context = Context.enter();
        context.initStandardObjects(scope);
        Context.exit();
    }
    
    public ScriptableObject getScope() {
        return scope;
    }

    public void loadFile(String filename) {
        try {
            FileReader fr = new FileReader(filename);
            Context context = Context.enter();
            context.evaluateReader(scope, fr, filename, 1, null);
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
            evaluateString("window.location = \"" + docpath.replaceAll("\\\\", "\\\\\\\\") + "\"");
        }
        else
            this.docpath = docpath;
    }

    public Object evaluateString(String toEvaluate) {
        Context context = Context.enter();
        try {
            return context.evaluateString(scope, toEvaluate, null, 1, null);
        }
        catch (Exception e) {
            throw UniversalRuntimeException.accumulate(e, "Error evaluating Javascript string " + toEvaluate);
        }
        finally {
            Context.exit();
        }
    }

    public Function getFunction(Object functionName) {
        try {
            Object func = evaluateString(functionName.toString());
            if (!(func instanceof Function)) {
                throw new IllegalArgumentException("Acquired object of " + func.getClass() + " rather than Function");
            }
            return (Function) func;
        }
        catch (Exception e) {
            throw UniversalRuntimeException.accumulate(e, "Error looking up name \"" 
                    + functionName + "\" as function");
        }
    }

    private void markLoaded() {
        if (debuggerLoader != null) {
            debuggerLoader.doBreak();
        }
    }

    public void loadJSONFiles(String prefix, String path) {
        String[] files = ResourceUtil.loadJsonArray(path);
        for (int i = 0; i < files.length; ++i) {
            loadFile(prefix + files[i]);
        }
        markLoaded();
    }

}

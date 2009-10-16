/*
Copyright 2009 University of Cambridge

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://source.fluidproject.org/svn/LICENSE.txt
*/

package org.fluidproject.kettle;

import java.io.FileReader;
import java.io.Reader;
import java.util.Map;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.ScriptableObject;

import uk.org.ponder.streamutil.StreamCloseUtil;
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
        Reader fr = null;
        try {
            Context context = Context.enter();
            fr = new FileReader(filename);
            context.evaluateReader(scope, fr, filename, 1, null);
            if (filename.endsWith("env.js") && docpath != null) {
                envLoaded = true;
                setDocument(this.docpath);
            }
        }
        catch (Exception e) {
            throw UniversalRuntimeException.accumulate(e, "Error evaluating file " + filename);
        }
        finally {
            StreamCloseUtil.closeReader(fr);
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
    
    public Object invokeFunction(Function func, Object[] args){
        Context context = Context.enter();
        try {
            return func.call(context, scope, null, args);
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

    public void loadJSONFiles(String context, String path, String prefix, Map mounts) {
        String[] files = ResourceUtil.loadJsonArray(context + path);
        for (int i = 0; i < files.length; ++i) {
            String resolved = ResourceUtil.resolveIncludePath(context, files[i], prefix, mounts);
            loadFile(resolved);
        }
        markLoaded();
    }

}

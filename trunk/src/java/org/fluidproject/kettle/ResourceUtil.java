/*
Copyright 2009 University of Cambridge

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://source.fluidproject.org/svn/LICENSE.txt
*/

package org.fluidproject.kettle;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletResponse;

import uk.org.ponder.errorutil.ConfigurationException;
import uk.org.ponder.json.support.DeJSONalizer;
import uk.org.ponder.saxalizer.SAXalizerMappingContext;
import uk.org.ponder.streamutil.StreamCloseUtil;
import uk.org.ponder.streamutil.StreamCopyUtil;
import uk.org.ponder.util.UniversalRuntimeException;

public class ResourceUtil {
    public static boolean booleanValue(Object totest) {
        if (totest == null) return false;
        if (totest instanceof Boolean) return ((Boolean)totest).booleanValue();
        else return totest.equals("true");
    }
    
    static Object readJson(String filename, Object root) {
        try {
            FileInputStream fis = new FileInputStream(filename);
            DeJSONalizer de = new DeJSONalizer(SAXalizerMappingContext.instance(), fis);
            Object togo = de.readObject(root, null);
            if (togo.getClass() != root.getClass()) {
                throw new IOException("Error in JSON file - expected root of " + 
                        root.getClass() + " but received " + togo.getClass());
            }
            return togo;
        }
        catch (Exception e) {
            throw UniversalRuntimeException.accumulate(e, 
                    "Error reading JSON file " + filename + " - invalid format");
        }
        finally {
            
        }
    }
    
    public static String resolveIncludePath(String context, String path, String prefix, Map mounts) {
        if (path.startsWith("$")) {
            int fsp = path.indexOf("/");
            String mountKey = path.substring(1, fsp);
            if (mounts == null || mounts.get(mountKey) == null) {
                throw UniversalRuntimeException.accumulate(new ConfigurationException(), "Include path " 
                        + path + " requests mount with unknown key " + mountKey);
            }
            Map mount = (Map) mounts.get(mountKey);
            return context + mount.get("source") + path.substring(fsp + 1);
        }
        else return context + prefix + path;
    }
    
    public static String pathToFileUrl(String path) {
        return "file://" + (path.charAt(0) == '/' ? "" : "/") + path;
    }
    
    public static String[] loadJsonArray(String filename) {
        return (String[]) readJson(filename, new String[] {});
    }

    public static Map loadJson(String filename) {
        return (Map) readJson(filename, new HashMap());
    }

    public static void sendResponse(HttpServletResponse response, Object tosend) {
        OutputStream os = null;
        try {
            os = response.getOutputStream();
            if (tosend instanceof File) {
                sendFile((File)tosend, os);
            }
            else {
                String s = tosend.toString();
                os.write(s.getBytes("UTF-8"));
            }
        }
        catch (Exception e) {
            System.err.print("Error writing response: " + e.getMessage());
        }
        finally {
            StreamCloseUtil.closeOutputStream(os);
        }
    }

    public static void sendFile(File tosend, OutputStream os) {
        try {
            InputStream is = new FileInputStream(tosend);
            StreamCopyUtil.inputToOutput(is, os, true, false, null);
        }
        catch (FileNotFoundException e) {
            throw UniversalRuntimeException.accumulate(e, "File " + tosend.getAbsolutePath() + " not found");
        }
    }
    
}

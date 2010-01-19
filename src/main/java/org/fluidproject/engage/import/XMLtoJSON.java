/*
 * Created on 12 Jun 2009
 */
package org.fluidproject.engage;

import java.io.FileInputStream;

public class XMLtoJSON {
  public static final String[] files = {
    "ENGAGE-246-test.xml",
  //  "ENGAGE-90-test.xml", "Cartoon.xml", "Headdress.xml", "Photograph.xml", "Snuffbox.xml" 
    };

  public static final String dir = "bin/testdata/artifacts/";

  public static final int reps = 1000;

  public static void main(String[] args) {
    long time = System.currentTimeMillis();
    try {
      for (int c = 0; c < reps; ++c) {
        for (int i = 0; i < files.length; ++i) {
          String filename = dir + files[i];
          FileInputStream fis = new FileInputStream(filename);
          XPPJSONGenerator gen = new XPPJSONGenerator();
          gen.parseStream(fis);
          fis.close();
        }
      }
    }
    catch (Exception e) {
      e.printStackTrace(System.err);
    }
    System.out
        .println("Template parsed in " + (System.currentTimeMillis() - time) + "ms");
  }
}

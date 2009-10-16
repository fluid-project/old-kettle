/*
Copyright 2009 University of Cambridge

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://source.fluidproject.org/svn/LICENSE.txt
*/

package org.fluidproject.kettle;

import org.mozilla.javascript.ContextFactory;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.tools.debugger.Dim;
import org.mozilla.javascript.tools.debugger.Main;
import org.mozilla.javascript.tools.debugger.SwingGui;

/**
 * A loader for the Rhino debugger suitable for running in a semi-embedded
 * environment such as Eclipse. Code copied from "Main.java".
 * @author Antranig Basman (amb26@ponder.org.uk)
 *
 */

public class DebuggerLoader {
  public Main main;
  public SwingGui swingGui;
  public Dim dim;
  public DebuggerLoader(String title, ScriptableObject root) {
    main = new Main(title);

    main.attachTo(ContextFactory.getGlobal());

    main.setScope(root);

    main.pack();
    main.setSize(600, 460);
    main.setVisible(true);
    swingGui = (SwingGui) main.getDebugFrame();
  }

  public void doBreak() {
    main.doBreak();
  }
  
}

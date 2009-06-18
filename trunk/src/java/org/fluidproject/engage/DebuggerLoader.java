/*
 * Created on 18 Jun 2009
 */
package org.fluidproject.engage;

import java.io.Reader;
import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.Method;

import org.mozilla.javascript.ContextFactory;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.tools.debugger.Dim;
import org.mozilla.javascript.tools.debugger.Main;
import org.mozilla.javascript.tools.debugger.SwingGui;

import uk.org.ponder.streamutil.StreamCopyUtil;
import uk.org.ponder.util.UniversalRuntimeException;

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
    main.doBreak();

    System.setIn(main.getIn());
    System.setOut(main.getOut());
    System.setErr(main.getErr());

    main.attachTo(ContextFactory.getGlobal());

    main.setScope(root);

    main.pack();
    main.setSize(600, 460);
    main.setVisible(true);
    swingGui = (SwingGui) main.getDebugFrame();
    try {
      Field dim = SwingGui.class.getDeclaredField("dim");
      dim.setAccessible(true);
      this.dim = (Dim) dim.get(swingGui);
    }
    catch (Exception e) {
      throw UniversalRuntimeException.accumulate(e);
    }
  }
  
  public void loadFile(String url, Reader reader) {
    try {
      
      dim.evalScript(url, StreamCopyUtil.readerToString(reader));
      return;
/*      Class clazz = Class.forName("org.mozilla.javascript.tools.debugger.RunProxy");
      Constructor cons = clazz.getConstructor(new Class[] {SwingGui.class, Integer.TYPE});
      cons.setAccessible(true);
      Object runProxy = cons.newInstance(new Object[] {swingGui, new Integer(2)}); // RunProxy.LOAD_FILE
      //proxy.fileName = fileName;
      //proxy.text = text;
      Field filename = clazz.getDeclaredField("fileName");
      filename.setAccessible(true);
      filename.set(runProxy, "url");
      Field text = clazz.getDeclaredField("text");
      text.setAccessible(true);
      text.set(runProxy, null);
      Method m = clazz.getMethod("run", new Class[] {});
      m.setAccessible(true);
      m.invoke(runProxy, new Object[] {});      */
    }
    catch (Exception e) {
      throw UniversalRuntimeException.accumulate(e);
    }
  }
}

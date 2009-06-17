/*
 * Created on 12 Jun 2009
 */
package org.fluidproject.engage;

import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.xmlpull.mxp1.MXParser;
import org.xmlpull.v1.XmlPullParser;

import uk.org.ponder.arrayutil.ListUtil;
import uk.org.ponder.stringutil.CharWrap;
import uk.org.ponder.util.UniversalRuntimeException;

public class XPPJSONGenerator {

  private Map root = new HashMap();
  private MXParser parser;

  public void parseStream(InputStream xmlstream) {
    parser = new MXParser();
    try {
      // parser.setFeature(FEATURE_XML_ROUNDTRIP, true);
      parser.setInput(xmlstream, "UTF-8");
      while (true) {
        int token = parser.nextToken();
        if (token == XmlPullParser.END_DOCUMENT)
          break;

        switch (token) {
        case XmlPullParser.START_TAG:
          boolean isempty = parser.isEmptyElementTag();
          processTagStart(parser, isempty);
          if (isempty) {
            parser.next();
          }
          break;
        case XmlPullParser.END_TAG:
          processTagEnd(parser);
          break;
        default:
          processDefaultTag(token, parser);
        }
      }

    }
    catch (Throwable t) {
      throw UniversalRuntimeException.accumulate(t, "Error parsing template");
    }
    // Logger.log.info("Template parsed in " + (System.currentTimeMillis() -
    // time) + "ms");
  }

  private int[] limits = new int[2];

  private CharWrap w = new CharWrap();

  private List stack = ListUtil.instance(root);

  private void processTagStart(XmlPullParser parser, boolean isempty) {
    int attrs = parser.getAttributeCount();
    Map topush = new HashMap(attrs < 3 ? (attrs + 1) * 2
        : attrs * 2);

    for (int i = 0; i < attrs; ++i) {
      String attrname = parser.getAttributeName(i);
      String attrvalue = parser.getAttributeValue(i);
      topush.put(attrname, attrvalue);
    }
    push(topush);
    stack.add(topush);
    w.clear();
    if (isempty) {
      stack.remove(stack.size() - 1);
    }
  }

  private void push(Object value) {
    String tagname = parser.getName();
    Map top = (Map) stack.get(stack.size() - 1);
    Object exist = null;
    boolean isempty = true;
    exist = top.get(tagname);
    if (exist instanceof Map) {
      isempty = ((Map) exist).isEmpty();
    }
    if (isempty) {
      top.put(tagname, value);
    }
    else {
      if (exist instanceof List || !value.equals("")) {
        if (!(exist instanceof List)) {
          exist = ListUtil.instance(exist);
          top.put(tagname, exist);
        }
        if (value instanceof String) {
          List lex = (List) exist;
          if (!value.equals("")) {
            ((Map) lex.get(lex.size() - 1)).put("nodetext", value);
          }
          else {
            lex.add(value);
          }
        }
      }
    }
  }

  private void processDefaultTag(int token, XmlPullParser parser) {
    char[] chars = parser.getTextCharacters(limits);
    w.append(chars, limits[0], limits[1]);
  }

  private void processTagEnd(XmlPullParser parser) {
    stack.remove(stack.size() - 1);
    push(w.toString().trim());

  }

}

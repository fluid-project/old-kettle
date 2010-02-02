/*
 * Created on 12 Jun 2009
 */
package org.fluidproject.engage;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.fluidproject.engage.xml.XPPJSONGenerator;

import uk.org.ponder.json.support.JSONProvider;
import uk.org.ponder.saxalizer.SAXalizerMappingContext;
import uk.org.ponder.streamutil.StreamCloseUtil;

import junit.framework.TestCase;

public class TestENGAGE246 extends TestCase {
    public static final String[] files = { "ENGAGE-246-test.xml", "ENGAGE-246-test-2.xml" };

    public static final int reps = 1000;

    public InputStream getResource(String name) {
        return getClass().getResourceAsStream("/" + name);
    }
    
    public Map readJSON(List patterns, int index) {
        InputStream fis = null;
        try {
            fis = getResource(files[index]);
            XPPJSONGenerator gen = new XPPJSONGenerator(patterns);
            gen.parseStream(fis);
            return gen.root;
        }
        finally {
            StreamCloseUtil.closeInputStream(fis);
        }

    }
    
    public void testEngage246() throws Exception {
        JSONProvider provider = new JSONProvider();
        provider.setMappingContext(new SAXalizerMappingContext());
        InputStream confis = getResource("ENGAGE-246-config.json");
        List patterns = (List) provider.readObject(new ArrayList(), confis);
        confis.close();

        Map root = readJSON(patterns, 0);

        Object thing = root.get("exhibit");
        assertNotNull("Required exhibit", thing);

        String JSON = provider.toString(root);
        assertEquals("Comment elided", -1, JSON.indexOf("XStandard"));
        assertEquals("p is not key", -1, JSON.indexOf("\"p\":"));
        assertTrue("Found Montréal", JSON.indexOf("Montréal") != -1);
        
        Map root2 = readJSON(patterns, 1);
        String JSON2 = provider.toString(root2);
        assertEquals("p is not key", -1, JSON2.indexOf("\"p\":"));
        String introduction = (String) ((Map)root2.get("exhibit")).get("introduction");
        assertTrue("Found <p>", introduction.startsWith("<p>"));

    }
}

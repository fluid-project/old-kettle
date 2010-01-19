/*
 * Created on 12 Jun 2009
 */
package org.fluidproject.engage;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

import org.fluidproject.engage.xml.XPPJSONGenerator;

import uk.org.ponder.json.support.JSONProvider;
import uk.org.ponder.saxalizer.SAXalizerMappingContext;

import junit.framework.TestCase;

public class TestENGAGE246 extends TestCase {
    public static final String[] files = { "ENGAGE-246-test.xml", };

    public static final int reps = 1000;

    public InputStream getResource(String name) {
        return getClass().getResourceAsStream("/" + name);
    }
    
    public void testEngage246() throws Exception {
        JSONProvider provider = new JSONProvider();
        provider.setMappingContext(new SAXalizerMappingContext());
        InputStream confis = getResource("ENGAGE-246-config.json");
        List patterns = (List) provider.readObject(new ArrayList(), confis);
        confis.close();
        
        InputStream fis = getResource(files[0]);
        XPPJSONGenerator gen = new XPPJSONGenerator(patterns);
        gen.parseStream(fis);
        fis.close();
        Object thing = gen.root.get("exhibit");
        assertNotNull("Required exhibit", thing);

        String JSON = provider.toString(gen.root);
        assertEquals("Comment elided", -1, JSON.indexOf("XStandard"));
        assertEquals("p is not key", -1, JSON.indexOf("\"p\":"));
    }
}

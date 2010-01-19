/*
 * Created on 17 Jan 2010
 */
package org.fluidproject.engage.xml;

import java.util.List;

public class TagPatterns {
    public static final TagPatternEntry[] compilePatterns(List patterns) {
        TagPatternEntry[] togo = new TagPatternEntry[patterns.size()];
        for (int i = 0; i < patterns.size(); ++ i) {
            togo[i] = new TagPatternEntry();
            String pattern = (String) patterns.get(i);
            togo[i].segs = pattern.split("\\.");
        }
        return togo;
    }
    
    public static final boolean processTagStart(TagPatternEntry[] entries, List stack, String tag) {
        boolean beginMatch = false;
        int stacksize = stack.size() - 1;
        for (int i = 0; i < entries.length; ++ i) {
            TagPatternEntry entry = entries[i];
            if (entry.matchupto == stacksize && entry.segs.length > stacksize) {
                String next = entry.segs[stacksize];
                if (next.equals(tag)) {
                    entry.matchupto ++;
                    if (entry.matchupto == entry.segs.length) {
                        beginMatch = true;
                    }
                }
            }
        }
        return beginMatch;
    }
    
    public static final boolean processTagEnd(TagPatternEntry[] entries, List stack, String tag) {
        boolean endMatch = false;
        int stacksize = stack.size();
        for (int i = 0; i < entries.length; ++ i) {
            TagPatternEntry entry = entries[i];
            if (entry.matchupto == stacksize && entry.segs[entry.matchupto - 1].equals(tag)) {
                entry.matchupto --;
                endMatch = true;
            }
        }
        return endMatch;
    }
}

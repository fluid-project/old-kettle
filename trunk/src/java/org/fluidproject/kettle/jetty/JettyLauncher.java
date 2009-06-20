/*
 * Created on 20 Jun 2009
 */
package org.fluidproject.kettle.jetty;

import org.mortbay.jetty.Connector;
import org.mortbay.jetty.Server;
import org.mortbay.jetty.nio.SelectChannelConnector;
import org.mortbay.jetty.webapp.WebAppContext;

public class JettyLauncher {
    public static void main(String[] args) throws Exception {
        Server server = new Server();

        Connector connector = new SelectChannelConnector();
        connector.setPort(Integer.getInteger("jetty.port", 8080).intValue());
        server.setConnectors(new Connector[] { connector });

        WebAppContext webapp = new WebAppContext("src/webapp", "/");

        server.setHandler(webapp);

        server.start();
        server.join();
    }
}
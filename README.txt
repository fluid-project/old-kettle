Fluid Engage 0.3
====================
Main Site:  http://fluidproject.org
Main Project Site: http://fluidengage.org/

Highlights of the 0.3 Release
=============================

New Features:
  * Home screen
  * My Collection
  * Guest Book and Comments
  * Search by Object Code
  * Internationalization: support for multiple languages

Improvements and Bug Fixes:
  * Updated Artifact page
  * Improved Browsing Experience
  * Support for remembering users and their settings using cookies
  * Improved user experience and styling
  * Substantial performance improvements throughout the application


What's in this Release?
=======================

This release is available as a zip file containing a WAR file suitable for deployment within a Java Servlet container such as Apache Tomcat:
    engage-0.3.zip/
      README.txt
      engage-0.3.war


Source Code
-----------

In the Deployment Bundle, the JavaScript source has been minified--comments and whitespace have been removed.

Developers wishing to modify or extend Fluid Engage, debug their application, or learn about the code, should check out the source code from the Fluid SVN repository:

Fluid Engage's source code is split into three discrete modules:

  1. Core Engage client-side code: 
  https://source.fluidproject.org/svn/fluid/engage/fluid-engage-core/trunk/

  2. Engage server-side and Kettle JavaScript framework: 
  https://source.fluidproject.org/svn/fluid/engage/fluid-engage-core/trunk/

  3. Infusion: 
  https://source.fluidproject.org/svn/fluid/infusion/trunk/

  An all-in-one checkout is available for creating a complete build of Engage:
  https://source.fluidproject.org/svn/fluid/fluid-all/

License
-------
Fluid Engage code is licensed under a dual ECL 2.0 / BSD license. The specific licenses can be
found in the license file:

  * LICENSE.txt
  

Engage also depends upon some third party open source modules. See below for more details.


Third Party Software in Engage
-------------------------------

Engage-Core:

  * jQuery UI javascript widget library v1.7: http://ui.jquery.com/ (MIT and GPL licensed http://docs.jquery.com/Licensing)
  * Cookie plugin by Klaus Hartl (stilbuero.de): http://plugins.jquery.com/project/Cookie (MIT and GPL)
  * jQuery hashchange event - v1.2 by "Cowboy" Ben Alman: http://benalman.com/projects/jquery-hashchange-plugin/ (MIT and GPL)
	
  Other third party software
  * ui.datepicker-stub.js, jquery.ui.datepicker-en-GB.js, and jquery.ui.datepicker-fr.js are based on jquery.ui.datepicker.js
	  (see: licensed http://docs.jquery.com/Licensing)

Engage-Kettle:

  * ponderutilcore v1.2.4B: http://rsf.fluidproject.org/wiki/Wiki.jsp?page=Main (BSD http://rsf.fluidproject.org/wiki/Wiki.jsp?page=Licence)
  * rhino v1.7R3pre2: http://www.mozilla.org/rhino/ (MPL, GPL, and/or Sun https://developer.mozilla.org/en/Rhino_License)
  * log4j v1.2.14: http://logging.apache.org/log4j/1.2/ (Apache2 http://logging.apache.org/log4j/1.2/license.html)
  * xpp3_min v1.1.3.4.O: http://www.extreme.indiana.edu/xgws/xsoap/xpp/mxp1/ (Indiana University Extreme! Lab Software License
	 http://www.extreme.indiana.edu/viewcvs/~checkout~/XPP3/java/LICENSE.txt)
  * junit v4.8.1: http://www.junit.org/ (CPL http://github.com/KentBeck/junit/blob/master/LICENSE)
  * jetty v6.1.18: http://jetty.codehaus.org/jetty/ (Apache2 and EPL http://www.eclipse.org/jetty/licenses.php)
  * jetty-util v6.1.18: http://jetty.codehaus.org/jetty/ (Apache2 and EPL http://www.eclipse.org/jetty/licenses.php)
  * xercesImpl v2.9.1: http://xerces.apache.org/ (Apache2 http://xerces.apache.org/xerces2-j/)

  Other third party software
  * KettleServlet.java is based on JackServlet
	  (see: http://github.com/tlrobinson/jack/blob/master/README.md)
  * servletJSGI.js is based on servlet.js "handler"
      (see: http://github.com/tlrobinson/jack/blob/master/README.md)
      
  Special Acknowledgements:
  * "This product includes software developed by the Indiana University Extreme! Lab (http://www.extreme.indiana.edu/)."
	

Documentation
=============

The Fluid Project uses a wiki for documentation and project collaboration: http://wiki.fluidproject.org.
The main Engage documentation can be found at:

    http://wiki.fluidproject.org/display/fluid/Fluid+Engage

Key Pages:
	
  * Engage's architectural documentation:
    http://wiki.fluidproject.org/display/fluid/Engage+Architecture
	
  * Server-side technology overview:
    http://wiki.fluidproject.org/display/fluid/Engage+Server-Side+Technology
	
  * Tutorial: How to Install Engage dependencies
    http://wiki.fluidproject.org/display/fluid/Setting+Up+CouchDB+and+Lucene
	
  * Tutorial: Installing and Configuring Engage (in-progress)
    http://wiki.fluidproject.org/display/fluid/Installing+and+Configuring+Fluid+Engage


Configuring Engage
==================

Engage depends on a collection of CouchDB databases. For more information about installing CouchDB, please refer to the documentation listed above. Out of the box, Engage is configured to access CouchDB installed on "localhost" at the standard port number of 5984. Currently, the process of changing the database location is somewhat complex, but can be accomplished by modifying the URLs in application/engageStandaloneConfig.json.

For an example of how Engage's CouchDB databases are structured, take a look our our daily build instance of Couch located at:

    http://142.150.154.59:5984/_utils/

Please note that the whole database and schema structure of Engage is due to change in a future release, making it substantially easier for integrators to import their data and customize the system.


Supported Platforms
===================

iPhone OS 3.0, 3.1

  * It is likely that any modern WebKit-based browser will work correctly.


Known Issues
============

The Fluid Project uses a JIRA website to track bugs: http://issues.fluidproject.org.
Some of the known issues in this release are described here:

  Engage-503: In VO, cannot use "next element" swipe to focus on elements within an open panel
  Engage-448: VoiceOver cannot be used to read the special messages produced by the object code entry screen
  Engage-446: The buttons on the nav bar don't have localized alt text
  Engage-442: The alt text for the media badge is not internationalizable
  Engage-392: Code entry areas not accessible to VoiceOver
  Engage-369: The My Collection markup spout makes museum-specific assumptions about the structure of raw artifact documents
  Engage-367: The Engage data mapping infrastructure is poorly factored, causing repetitive code and subtle museum-specific schema assumptions

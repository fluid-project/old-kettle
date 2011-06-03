Kettle is the Fluid Project's experimental server-side platform, based on node.js.

The homepage for Kettle is at http://wiki.fluidproject.org/display/fluid/Kettle, with issue tracking at http://issues.fluidproject.org/browse/KETTLE .

Kettle operates by executing [Fluid Infusion](http://www.fluidproject.org/products/infusion/) and jQuery on the server-side, by means of jsdom and some other integration libraries. 

Installation instructions:
-

Firstly, install node, and, if you like, npm. 

Secondly, read the instructions for [node.js module resolution](http://nodejs.org/api/modules.html#loading_from_node_modules_Folders) - when running, kettle will expect to see the following modules in node_modules (lhs is npm name, rhs is git source)

    htmlparser    git://github.com/tautologistics/node-htmlparser.git
    jsdom         git://github.com/tmpvar/jsdom.git
    request       git://github.com/mikeal/request.git
    cssom         git://github.com/NV/CSSOM.git
    fluid-xhr     git@github.com:fluid-project/xhr.git

Running
-

From the checkout directory for kettle, run 

    node [--debug] src/main/webapp/kettle/js/V8Loader.js

you will see lots of bumpf and then finally 
    
    Server running on port 8080

The main configuration file is src/main/webapp/application/kettleConfig.json, which refers to applications in "appPaths" and mounts in "mounts". Und maunzen, und maunzen, und maunzen.
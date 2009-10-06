The ant build script is used for creating a deployment bundle of Fluid Engage.
It is meant to be run from within the directory structure created by the fluid-all externals project. http://source.fluidproject.org/svn/fluid/fluid-all/

These are the things it still needs to do:
  1. Minify engage-client
  2. fix paths and URLs to CouchDB so that the war works
  3. zip the packages
  4. create this directory structure for kettle:
      apps
      	engage
      	demos
  5. in the src version of engage, provide a src version of infusion
  6. determine if kettleDemo should be included in the package
  
These are tidy up tasks that still need to be done:
  1. put in a complete description in the ant file for how to run it
  2. fix the naming of the properties - they aren't all clear.
  3. rename artifact demo to artifact
  

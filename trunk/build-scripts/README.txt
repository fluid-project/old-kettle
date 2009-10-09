The ant build script is used for creating a deployment bundle of Fluid Engage.
It is meant to be run from within the directory structure created by the fluid-all externals project. http://source.fluidproject.org/svn/fluid/fluid-all/

These are the things it still needs to do:
  1. build a src WAR and a dist WAR and put them in the correct packages
  2. Minify engage-client
  3. zip the packages
  4. create this directory structure for kettle:
      apps
      	engage
      	demos
  5. in the src version of engage, provide a src version of infusion
  6. determine if kettleDemo should be included in the package
  7. rename artifact demo to artifact
  
These are tidy up tasks that still need to be done:
  1. fix the naming of the properties - they aren't all clear.
  2. check the use of build and products for sanity and cleanliness.  
  3. Address repetition between Infusion and Engage builds: FLUID-3243
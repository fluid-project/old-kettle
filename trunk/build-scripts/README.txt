The ant build script is used for creating a deployment bundle of Fluid Engage.
It is meant to be run from within the directory structure created by the fluid-all externals project. http://source.fluidproject.org/svn/fluid/fluid-all/

These are the things it still needs to do:
  1. Remove engage non-production stuff (i.e. mapping, kettle-demo, etc.)
  2. Minify engage-client
  3. Build WAR with Maven, resolving all dependencies
  4. zip the packages

These are tidy up tasks that still need to be done:
  1. put in a complete description in the ant file for how to run it
  2. address repetition between infusion ant script and engage ant script using the 'import' ant task
  3. fix the naming of the properties - they aren't all clear.
  4. rename artifact demo to artifact
  
These are things we still need to address:
  1. For Engage 0.1 do we want an Engage-all.js?
  2. Do we want lint support for Engage in ant?
  3. Should the infusion build happen in the infusion dir the way it currently is, or should we keep everything we build in the engage dir?
  4. Should infusion be minified in the engage src release? 


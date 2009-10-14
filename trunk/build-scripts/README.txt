The ant build script is used for creating a deployment bundle of Fluid Engage.
It is meant to be run from within the directory structure created by the fluid-all externals project. http://source.fluidproject.org/svn/fluid/fluid-all/

These are the things it still needs to do:
  1. add licenses to the war
  
These are tidy up tasks that still need to be done:
  1. Address repetition between Infusion and Engage builds: FLUID-3243
  		- code to minify engage client is quite similar to infusion
  2. Fix the errors that minify is throwing	 	
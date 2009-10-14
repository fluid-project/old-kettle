The ant build script is used for creating a deployment bundle of Fluid Engage.
It is meant to be run from within the directory structure created by the fluid-all externals project. http://source.fluidproject.org/svn/fluid/fluid-all/

These are the things it still needs to do:
  1. remove the packages and replace them with the WAR files - the source war should have src in the name
  2. change the name of the war to be 'engage' instead of 'kettle' (the maven artifact name must change)
  
These are tidy up tasks that still need to be done:
  1. fix the naming of the properties - they aren't all clear.
  2. check the use of build and products for sanity and cleanliness.  
  3. Address repetition between Infusion and Engage builds: FLUID-3243
  		- code to minify engage client is quite similar to infusion
  		- WAR targets have a lot of repetition in them
  4. Remove unused properties and targets  		
  		 	
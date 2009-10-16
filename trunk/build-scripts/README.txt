The ant build script is used for creating a deployment bundle of Fluid Engage.
It is meant to be run from within the directory structure created by the fluid-all externals project. http://source.fluidproject.org/svn/fluid/fluid-all/

These are the things it still needs to do:
  1. ensure everything in the new directory structure that should be shipped is included

Note: We still need to address repetition between Infusion and Engage builds: FLUID-3243


refactor the copy war files to remove repetition. 
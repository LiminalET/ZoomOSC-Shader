# ZoomOSC-Shader

A GSL shader which works nicely with zoomOSC allowing easy splitting up of the grid to separate user cells

Easiest way to play is with the sample isadora file - you simply need to set the NDI watcher to a capture of your zoom gallery window and it should work. A few things to be aware of are:
- for the maths to work your zoom gallery needs to be a 16:9 window, otherwise the rows/cols will be out of sync.
- You may need to adjust the capture area that the shader is looking at - in the shader turn on “dispInputArea” and then adjust the userMaster.. values so the red box is covering all of the gallery but nothing else (exclude top and bottom bar) - once you’ve got this right you shouldn’t need to change it..

I also find that with a very small number of users (less that four I think) the maths doesn't fully work as zoom does something funky - so test with four or more people..


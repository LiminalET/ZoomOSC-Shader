// Zoom re-arranging shader in .frag format for Isadora
// Written by Richard Williamson (richard@theatre.support) and Ash Green (ashley@ashley-green.com)
// https://github.com/LiminalET/ZoomOSC-Shader/
// feel free to edit and adapt but please let us know what you do!
// Converted from ISF via the isadora tool
// ISADORA_INT_PARAM_ONOFF(dispInputArea, [ut>, 0, "For testing - show the entire input image")
// ISADORA_INT_PARAM_ONOFF(dispCellArea, &s]F, 0, "For testing - overlay the specified cell crop")
// ISADORA_INT_PARAM(numCallerRows, Pbrd, 0, 10, 0, "The number of rows in the zoom gallery (leave at 0 to automatically calculate)")
// ISADORA_INT_PARAM(numCallerColumns, f]c], 0, 10, 0, "The number of cols in the gallery (leave at 0 to automatically calculate)")
// ISADORA_FLOAT_PARAM(galleryCount, x#+O, 0, 50, 0, "The number of video cells in the gallery")
// ISADORA_INT_PARAM(borderLayers, [ux>, 0, 100, 2, "border gallery rows (0 as normal grid)")
// ISADORA_INT_PARAM(outputOffset,-j7g, 0, 100, 0, "Output cell offset")
// ISADORA_INT_PARAM(outputGridWidth, -i-#, 0, 20, 8, "How many columns in the output grid")
// ISADORA_INT_PARAM(outputGridHeight, q*1T, 0, 20, 4, "How many rows in the output grid")
// ISADORA_FLOAT_PARAM(specifyCell, $~#v, -1, 50, -1, "Specify a specific cell to capture (-1 to capture all)")
// ISADORA_FLOAT_PARAM(excludeCell, &v/z, -1, 50, -1, "Specify a specific cell to exclude in the gallery (-1 to ignore)")
// ISADORA_FLOAT_PARAM(userMasterScale_x, 3*FT, 0, 100, 100, "The Width of the input image to capture")
// ISADORA_FLOAT_PARAM(userMasterScale_y, wn+5, 0, 100, 100, "The height of the input image to capture")
// ISADORA_FLOAT_PARAM(userMasterOffset_x, ECde, -100, 100, 0, "The x offset of the input image to capture")
// ISADORA_FLOAT_PARAM(userMasterOffset_y, veuD, -100, 100, 0, "The y offset of the input image to capture")

#define userMasterScale vec2(userMasterScale_x,userMasterScale_y)
#define userMasterOffset vec2(userMasterOffset_x,userMasterOffset_y)

uniform sampler2D tex0;
uniform bool dispInputArea;
uniform bool dispCellArea;
uniform int borderLayers;
uniform int numCallerRows;
uniform int numCallerColumns;
uniform float galleryCount;
uniform int outputOffset;
uniform int outputGridWidth;
uniform int outputGridHeight;
uniform float specifyCell;
uniform float excludeCell;
uniform float userMasterScale_x;
uniform float userMasterScale_y;
uniform float userMasterOffset_x;
uniform float userMasterOffset_y;
uniform vec2 resolution_tex0;
uniform vec2 resolution;

void main()	{
    
	gl_FragColor=vec4(0.0,0.0,0.0,1.0);

    //frame size is the inner blank section which actually seems to be ignored..
    //input values
    vec2 inputGridCount=vec2(float(numCallerColumns),float(numCallerRows));
            
    //take the frame and if it's not 16:9 knock it to that
    vec2 masterScale = userMasterScale / 100.0;
    vec2 masterOffset = ((1.0 - masterScale) / 2.0) + (userMasterOffset / 100.0);
        

    
    if (numCallerColumns == 0) //auto
    {
        //calculate caller grid automatically
        float cols = ceil(sqrt(galleryCount));
        if (cols - (sqrt(galleryCount)) > 0.9999)
            cols = cols - 1.0;
        float rows = ceil(galleryCount / cols);
        //bodge for rounding error..
        if (rows - (galleryCount / cols) > 0.9999)
            rows = rows - 1.0;
    
        inputGridCount = vec2(cols, rows);
    }

    float numberOfInputGridSegments=inputGridCount.x*inputGridCount.y;


    
    //convert to pixel sizes to do the maths
    vec2 sizeOfInputArea = resolution_tex0 * masterScale;

    vec2 sizeOfInputRectCell = (sizeOfInputArea / inputGridCount);
       
    
    vec2 innerOffset = vec2(0.0, 0.0);
       
    if ((sizeOfInputRectCell.x * (9.0 / 16.0)) * inputGridCount.y > sizeOfInputArea.y)
       {
           //too wide for available height, shrink.
           float w = (sizeOfInputRectCell.y / 9.0) * 16.0;
           sizeOfInputRectCell.x = w;
           innerOffset.x = ((sizeOfInputArea.x - (sizeOfInputRectCell.x * inputGridCount.x)) / 2.0);
       } else if ((sizeOfInputRectCell.y * (16.0 / 9.0) * inputGridCount.x) > sizeOfInputArea.x)
       {
           float h = (sizeOfInputRectCell.x / 16.0) * 9.0;
           //h = testF;
           sizeOfInputRectCell.y = h;
           innerOffset.y = ((sizeOfInputArea.y - (sizeOfInputRectCell.y * inputGridCount.y)) / 2.0);
       }
    
    //now convert back to proportion
    sizeOfInputRectCell = sizeOfInputRectCell / resolution_tex0;
    innerOffset = innerOffset / resolution_tex0;
    

    //output values - number of cells for output, includes the gap in the middle..
    vec2 outputGridCount = vec2(float(outputGridWidth),float(outputGridHeight));

    vec2 sizeOfOutputRectCell = vec2(1.0/outputGridCount.x,(1.0/outputGridCount.y));
    float numberOfOutputGridSegments=outputGridCount.x*outputGridCount.y;

    vec2 currentCell = floor(gl_TexCoord[0].xy/sizeOfOutputRectCell);

    bool drawOutputCell = true;
    if (borderLayers > 0)
    { //only want to display around edges of screen..
    //check if we are drawing a cell we want (on the outer edges of the frame
    	//if (true) {
    	if (currentCell.x > float(borderLayers - 1) && currentCell.x < (outputGridCount.x - float(borderLayers)) && (currentCell.y > float(borderLayers - 1)) && currentCell.y < (outputGridCount.y - float(borderLayers))) {
        //we are not.. just draw black (we are in middle of screen)
            gl_FragColor=vec4(0.0,0.0,0.0,0.0);
	    	drawOutputCell = false;
	    
        }
    }
    
    if (drawOutputCell)
    {
        //work out the index of the input cell we want to draw,
        int cellToDrawIndex;
        float rowOffset = 0.0;
        
        if (specifyCell >= 0.0)
        { //am only drawing one cell
            cellToDrawIndex = int(specifyCell);
        } else if (borderLayers > 0)
		{ //am using border view so work out which cell..
	    	if (currentCell.y < float(borderLayers)) //bottom rows, 
            {  //bottom row, first work out out how many were in the bottom rows
                int topRows = borderLayers * int(outputGridCount.x);
                //then work out from top down how many we've had above 
                int aboveUs = int((currentCell.y) * outputGridCount.x);
                cellToDrawIndex = aboveUs + int(currentCell.x) + topRows;
            } else if (currentCell.y < (outputGridCount.y - float(borderLayers)))
            { //a mid-row, if above zero then add one (will be on right)
                //cell should be the bottom row of cells, plus 2*the
                
                int topBottomRows = (borderLayers * int(outputGridCount.x)) * 2;
                int aboveUs = (int(currentCell.y) - borderLayers) * (borderLayers * 2);
                
                
                cellToDrawIndex = topBottomRows + aboveUs + int(currentCell.x);
                

                if (currentCell.x > float(borderLayers)) //right hand side
                    cellToDrawIndex -= int(outputGridCount.x) - (borderLayers * 2);

            } else
            { //top rows
                cellToDrawIndex = int(currentCell.x + ((outputGridCount.y - currentCell.y - 1.0) * (outputGridCount.x) ));
            }
	} else {
	    //not border view, so draw the cell we've been sent
	    cellToDrawIndex = int(currentCell.x) + int(((outputGridCount.y - currentCell.y - 1.0) *outputGridCount.x));
	}
        
        if (outputOffset > 0)
        {
        	cellToDrawIndex -= outputOffset;
        } 
	
	//Exclude the cell index specified(Adds 1 to the cell index)
        if(excludeCell!=-1.0 && float(cellToDrawIndex) >= excludeCell)
        {
            cellToDrawIndex += 1;
        }

        if ((cellToDrawIndex > int(galleryCount - 1.0)) || cellToDrawIndex < 0) //int(numberOfInputGridSegments/* - 1.0*/)) || cellToDrawIndex < outputOffset)
        { //don't have enough cells to draw..
            gl_FragColor = vec4(0.0,0.0,0.0,0.0);
        } else
        {

            //now work out where this is in terms of the inputs, so the x will be floor of cellToDraw / numberOfInputCols
            vec2 selectedCellCoOrd;
            float origGridWidth = inputGridCount.x;

            selectedCellCoOrd.y = (inputGridCount.y - 1.0) - floor(float(cellToDrawIndex) / origGridWidth);
            //add the padding
            
            //a dirty bodge to fix a horrible float issue..
            float remainder = (float(cellToDrawIndex) / origGridWidth) - floor(float(cellToDrawIndex) / origGridWidth);
            if (remainder < 0.999 || cellToDrawIndex == 0)
                selectedCellCoOrd.x = mod(float(cellToDrawIndex), float(origGridWidth));
            else
            { //we have the rounding error.. bodge..
                selectedCellCoOrd.x = 0.0;
                selectedCellCoOrd.y -= 1.0;
            }
            
            if (selectedCellCoOrd.y == 0.0)
            { //bottom row, check for centering..
                if (galleryCount > 0.0)
                { //check the count
                    float rem = (inputGridCount.x * inputGridCount.y) - galleryCount;
                    if (rem > 0.0)
                    { //we don't fill last row
                        rowOffset = rem / 2.0;
                    }
                }
            }
            

            //calculate grid in input
            //vec2 inputRectCoords = vec2(selectedCellCoOrd / inputGridCount);
            
            vec2 inputRectCoords = (selectedCellCoOrd * sizeOfInputRectCell) + masterOffset + innerOffset;
            rowOffset = rowOffset * sizeOfInputRectCell.x;
            
            inputRectCoords.x += rowOffset;
            
            if(dispCellArea){
                if((gl_TexCoord[0].xy.x > inputRectCoords.x  && gl_TexCoord[0].xy.y > inputRectCoords.y ) && (gl_TexCoord[0].xy.x < (inputRectCoords.x + sizeOfInputRectCell.x) && gl_TexCoord[0].xy.y < (inputRectCoords.y + sizeOfInputRectCell.y)))
                {
                    gl_FragColor=texture2D(tex0, gl_TexCoord[0].xy) * vec4(1.0,1.0,1.0,1.0) + vec4(1.0, 1.0, 1.0, 1.0) ;
                } else
                {
                    gl_FragColor=texture2D(tex0, gl_TexCoord[0].xy);
        
                }

            } else {

                //pixel value to draw to screen

                //work out the scale factor for the cell
                vec2 scale = sizeOfInputRectCell/sizeOfOutputRectCell;
                vec2 posInCell = mod(gl_TexCoord[0].xy,sizeOfOutputRectCell);

                vec2 pixToGrab = (posInCell * scale) + inputRectCoords; // inputAreaSize + inputAreaBL;
              
                gl_FragColor=texture2D(tex0, pixToGrab);
            }
        }


    }





    //TESTING OPTIONS
    //show input Area
    if(dispInputArea){
        
        if((gl_TexCoord[0].xy.x > masterOffset.x && gl_TexCoord[0].xy.y > masterOffset.y) && (gl_TexCoord[0].xy.x < (masterOffset.x + masterScale.x) && gl_TexCoord[0].xy.y < (masterOffset.y + masterScale.y)))
                {
                    gl_FragColor=texture2D(tex0, gl_TexCoord[0].xy) * vec4(0.0,1.0,1.0,0.5) + vec4(1.0, 0.0, 0.0, 1.0) ;
                } else
                {
                    gl_FragColor=texture2D(tex0, gl_TexCoord[0].xy);
        
                }

    }
    




}

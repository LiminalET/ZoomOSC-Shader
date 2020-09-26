// Zoom re-arranging shader in .frag format for Isadora
// Converted from ISF via the isadora tool
// ISADORA_INT_PARAM_ONOFF(dispInputArea, [ut>, 0, "For testing - show the entire input image")
// ISADORA_INT_PARAM_ONOFF(dispCellArea, &s]F, 0, "For testing - overlay the specified cell crop")
// ISADORA_INT_PARAM(numCallerRows, Pbrd, 0, 10, 0, "The number of rows in the zoom gallery (leave at 0 to automatically calculate)")
// ISADORA_INT_PARAM(numCallerColumns, f]c], 0, 10, 0, "The number of cols in the gallery (leave at 0 to automatically calculate)")
// ISADORA_FLOAT_PARAM(galleryCount, x#+O, 0, 50, 0, "The number of video cells in the gallery")
// ISADORA_INT_PARAM(outputGridWidth, -i-#, 0, 9, 8, "How many columns in the output grid")
// ISADORA_INT_PARAM(outputGridHeight, q*1T, 0, 9, 4, "How many rows in the output grid")
// ISADORA_FLOAT_PARAM(specifyCell, $~#v, -1, 50, -1, "Specify a specific cell to capture (-1 to capture all)")
// ISADORA_FLOAT_PARAM(excludeCell, &v/z, -1, 50, -1, "Specify a specific cell to exclude in the gallery (-1 to ignore)")
// ISADORA_FLOAT_PARAM(userMasterScale_x, 3*FT, 0, 100, 100, "The Width of the input image to capture")
// ISADORA_FLOAT_PARAM(userMasterScale_y, wn+5, 0, 100, 100, "The height of the input image to capture")
// ISADORA_FLOAT_PARAM(userMasterOffset_x, ECde, -100, 100, 0, "The x offset of the input image to capture")
// ISADORA_FLOAT_PARAM(userMasterOffset_y, veuD, -100, 100, 0, "The y offset of the input image to capture")
// ISADORA_FLOAT_PARAM(testF, YH7S, -1000000, +1000000, 0, "No help available.")

#define userMasterScale vec2(userMasterScale_x,userMasterScale_y)
#define userMasterOffset vec2(userMasterOffset_x,userMasterOffset_y)

uniform sampler2D tex0;
uniform bool dispInputArea;
uniform bool dispCellArea;
uniform int numCallerRows;
uniform int numCallerColumns;
uniform float galleryCount;
uniform int outputGridWidth;
uniform int outputGridHeight;
uniform float specifyCell;
uniform float excludeCell;
uniform float userMasterScale_x;
uniform float userMasterScale_y;
uniform float userMasterOffset_x;
uniform float userMasterOffset_y;
uniform float testF;
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

    //first work on in pixel size
    //check that cells are 16:9
    //find the smaller of the two bounds
    
//    if ((((sizeOfInputRectCell.x) / 16.0) * 9.0) > (((sizeOfInputRectCell.y) / 9.0) * 16.0))
//    {
//        //y is bigger, use x
//        sizeOfInputRectCell.y = (((sizeOfInputRectCell.x) / 16.0) * 9.0);
//    } else
//    {  //x is bigger, use y
//        sizeOfInputRectCell.x = ((sizeOfInputRectCell.y) / 9.0) * 16.0;
//
//    }
    
    //now convert to relaitive size
//    float inputHeightAspect = (resolution.y * masterScale.y) / (resolution.x * masterScale.x);
//    vec2 sizeOfInputRectCell = (masterScale / inputGridCount);
//
//    //sizeOfInputRectCell.y = sizeOfInputRectCell.x * (inputHeightAspect);
//
//    if ((sizeOfInputRectCell.x * inputGridCount.x) * (9.0 / 16.0) > masterScale.y)
//    {
//        //too wide for available height, shrink.
//        float factor = masterScale.y / ((sizeOfInputRectCell.x * inputGridCount.x) * (9.0 / 16.0));
//        factor = testF;
//        sizeOfInputRectCell.x = factor;
//    } else if ((sizeOfInputRectCell.y * inputGridCount.y) * (16.0 / 9.0) > masterScale.x)
//    {
//        float h = (sizeOfInputRectCell.y / 16.0) * 9.0;
//        //factor = testF;
//        sizeOfInputRectCell.y = h;
//    }
    
    //convert to pixel sizes to do the maths
    vec2 sizeOfInputArea = resolution_tex0 * masterScale;

    vec2 sizeOfInputRectCell = (sizeOfInputArea / inputGridCount);
       
       //sizeOfInputRectCell.y = sizeOfInputRectCell.x * (inputHeightAspect);
    
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
    // vec2 sizeOfOutputRect=vec2(.25,.25);

    vec2 sizeOfOutputRectCell = vec2(1.0/outputGridCount.x,(1.0/outputGridCount.y));
    float numberOfOutputGridSegments=outputGridCount.x*outputGridCount.y;

    //position of frag in grid and rectangle (destination)
    vec2 currentCell = floor(gl_TexCoord[0].xy/sizeOfOutputRectCell);

    //check if we are drawing a cell we want (on the outer edges of the frame
    if (currentCell.x > 0.0 && currentCell.x < (outputGridCount.x - 1.0) && (currentCell.y > 0.0) && currentCell.y < (outputGridCount.y - 1.0)) {
        //we are not.. just draw black (we are in middle of screen)
        gl_FragColor=vec4(0.0,0.0,0.0,0.0);

    } else
    {
        //work out the index of the cell we want to draw,
        int cellToDrawIndex;
        float rowOffset = 0.0;
        
        if (specifyCell >= 0.0)
        { //am only drawing one cell
            cellToDrawIndex = int(specifyCell);
        } else if (currentCell.y == 0.0) //bottom row, 
        {
            //width of the grid + 2x height of the grid
            //cellToDrawIndex = int ((outputGridCount.x + ((outputGridCount.y - 2.0) * 2.0) + currentCell.x)) ;
            //draw bottom row second after top row
            cellToDrawIndex = int ((outputGridCount.x  + currentCell.x)) ;


            
        } else if (currentCell.y < outputGridCount.y - 1.0)
        { //a mid-row, if above zero then add one (will be on right)
            //draw sides last
            //cell should be the bottom row of cells, plus 2*the
            //cellToDrawIndex = int((((outputGridCount.y - currentCell.y) - 1.0) * 2.0) + outputGridCount.x  - 2.0);
            cellToDrawIndex = int((((outputGridCount.y - currentCell.y) - 1.0) * 2.0) + (2.0 * outputGridCount.x)  - 2.0);


            if (currentCell.x > 0.0)
                cellToDrawIndex += 1;

            //cellToDrawIndex = cellX;
        } else
        { //top row
            cellToDrawIndex = int(currentCell.x);// ((currentCell.y - 1.0) * inputGridCount.x);
        }
        //Exclude the cell index specified(Adds 1 to the cell index)
        if(excludeCell!=-1.0 && float(cellToDrawIndex) >= excludeCell){
            cellToDrawIndex += 1;
        }

        if (cellToDrawIndex > int(numberOfInputGridSegments - 1.0))
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





    // if(posInInRect.y>inputRectCoords.y){
    // 	gl_FragColor=vec4(0.0,1.0,0.0,1.0);
    // }




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
    




//TESTS
// if(gl_TexCoord[0].xy.x>sizeOfInputRect.x+inputAreaBL.x&&gl_TexCoord[0].xy.y>sizeOfInputRect.y+inputAreaBL.y)
// gl_FragColor = vec4(1.0,0.0,0.0,1.0);

}


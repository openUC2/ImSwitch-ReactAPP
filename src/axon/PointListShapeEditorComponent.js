import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Input, Select, MenuItem, FormControl } from "@mui/material";

import * as experimentSlice from "../state/slices/ExperimentSlice";

import { Shape } from "./WellSelectorCanvas.js";

//##################################################################################
const PointListShapeEditorComponent = () => {
  const Shape_Off = "off";//Note: MenuItems cant have emty value (""/Shape.EPMTY) as default value
  // States for shape, neighborsX, and neighborsY
  const [shape, setShape] = useState(Shape_Off);
  const [neighborsX, setNeighborsX] = useState(0);
  const [neighborsY, setNeighborsY] = useState(0);

  //redux dispatcher
    const dispatch = useDispatch();
  
    // Access global Redux state
    const experimentState = useSelector(experimentSlice.getExperimentState);
    

  //##################################################################################
  const handleSetAllClick = () => {
    // Your logic here
    console.log('Set All button clicked', experimentState);

    const updatedPointList = experimentState.pointList.map((point) => ({
        ...point,
        shape: shape,
        neighborsX: neighborsX, 
        neighborsY: neighborsY, 
      }));
  
      // Update the state with the modified list
      dispatch(experimentSlice.setPointList(updatedPointList)); 

  };

  //##################################################################################
  return (
    <div
      style={{
        border: "1px solid #eee",
        textAlign: "left",
        padding: "10px",
        margin: "0px",
      }}
    >
      {/* Header */}
      <h4 style={{ margin: "0", padding: "0" }}>Point List Shape Editor</h4>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          //border: "1px solid #cfc",
        }}
      >
        
        <FormControl>
          <Select
            sx={{ height: "32px" }}
            value={shape}
            onChange={(e) => setShape(e.target.value)} // directly call setShape
          >
            <MenuItem value={Shape_Off}>Off</MenuItem>
            <MenuItem value={Shape.RECTANGLE}>Rect</MenuItem>
            <MenuItem value={Shape.CIRCLE}>Circle</MenuItem>
          </Select>
        </FormControl>

              {shape != Shape_Off && <div>nX:</div>}
              {shape != Shape_Off && (
        <Input
          type="number"
          value={neighborsX}
          min="0"
          max="1000"
          onChange={(e) => setNeighborsX(parseInt(e.target.value, 10))} // directly call setNeighborsX
          placeholder="X value"
        />
    )}
      {shape == Shape.RECTANGLE && (
                <div>nY:</div>
              )}
              { shape == Shape.RECTANGLE && (
               
        <Input
          type="number"
          value={neighborsY}
          min="0"
          max="1000"
          onChange={(e) => setNeighborsY(parseInt(e.target.value, 10))} // directly call setNeighborsY
          placeholder="Y value"
        />
    )}
        <Button variant="contained" onClick={handleSetAllClick}>
          Set All
        </Button>
      </div>
    </div>
  );
};

export default PointListShapeEditorComponent;

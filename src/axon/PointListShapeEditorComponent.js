import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Input, Select, MenuItem, FormControl } from "@mui/material";

import * as experimentSlice from "../state/slices/ExperimentSlice";

import { Shape } from "./WellSelectorCanvas.js";

//##################################################################################
const PointListShapeEditorComponent = () => {
  const Shape_Off = "off"; //Note: MenuItems cant have emty value (""/Shape.EPMTY) as default value
  // States for shape, neighborsX, and neighborsY
  const [shape, setShape] = useState(Shape_Off);
  const [rectPlusX, setRectPlusX] = useState(0);
  const [rectMinusX, setRectMinusX] = useState(0);
  const [rectPlusY, setRectPlusY] = useState(0);
  const [rectMinusY, setRectMinusY] = useState(0);
  const [circleRadiusX, setCircleRadiusX] = useState(0);
  const [circleRadiusY, setCircleRadiusY] = useState(0);

  //redux dispatcher
  const dispatch = useDispatch();

  // Access global Redux state
  const experimentState = useSelector(experimentSlice.getExperimentState);

  //##################################################################################
  const handleSetAllClick = () => {
    // Your logic here
    console.log("Set All button clicked", experimentState);

    let updatedPointList = [];
    if (shape == Shape_Off) {
      updatedPointList = experimentState.pointList.map((point) => ({
        ...point,
        shape: shape,
      }));
    } else if (shape == Shape.RECTANGLE) {
      updatedPointList = experimentState.pointList.map((point) => ({
        ...point,
        shape: shape,
        rectPlusX: rectPlusX,
        rectPlusY: rectPlusY,
        rectMinusX: rectMinusX,
        rectMinusY: rectMinusY,
      }));
    } else if (shape == Shape.CIRCLE) {
      updatedPointList = experimentState.pointList.map((point) => ({
        ...point,
        shape: shape,
        circleRadiusX: circleRadiusX,
        circleRadiusY: circleRadiusY,
      }));
    }

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

        {/* Rect */}
        {shape == Shape.RECTANGLE && (
          <div>
            <div>
              -X: 
              <Input
                type="number"
                value={rectMinusX}
                min="-1000000"
                max="0"
                onChange={(e) => setRectMinusX(parseInt(e.target.value, 10))} // directly call setNeighborsX
                placeholder="X value"
              />
              +X: 
              <Input
                type="number"
                value={rectPlusX}
                min="0"
                max="1000000"
                onChange={(e) => setRectPlusX(parseInt(e.target.value, 10))} // directly call setNeighborsY
                placeholder="Y value"
              />
            </div>
            <div>
              -Y: 
              <Input
                type="number"
                value={rectMinusY}
                min="-1000000"
                max="0"
                onChange={(e) => setRectMinusY(parseInt(e.target.value, 10))} // directly call setNeighborsX
                placeholder="X value"
              />
              +Y: 
              <Input
                type="number"
                value={rectPlusY}
                min="0"
                max="1000000"
                onChange={(e) => setRectPlusY(parseInt(e.target.value, 10))} // directly call setNeighborsY
                placeholder="Y value"
              />
            </div>
          </div>
        )}

        {/* Circle */}
        {shape == Shape.CIRCLE && (
          <>
            <div>rX:</div>
            <Input
              type="number"
              value={circleRadiusX}
              min="-1000000"
              max="0"
              onChange={(e) => setCircleRadiusX(parseInt(e.target.value, 10))} // directly call setNeighborsX
              placeholder="X value"
            />
            <div>rY:</div>
            <Input
              type="number"
              value={circleRadiusY}
              min="0"
              max="1000000"
              onChange={(e) => setCircleRadiusY(parseInt(e.target.value, 10))} // directly call setNeighborsY
              placeholder="Y value"
            />
          </>
        )}

        <Button variant="contained" onClick={handleSetAllClick}>
          Set All
        </Button>
      </div>
    </div>
  );
};

export default PointListShapeEditorComponent;

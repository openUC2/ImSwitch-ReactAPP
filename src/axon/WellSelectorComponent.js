import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import WellSelectorCanvas, { Mode } from "./WellSelectorCanvas.js";
import WellSelectorUtils from "./WellSelectorUtils.js";

import * as wellSelectorSlice from "../state/slices/WellSelectorSlice.js";

//##################################################################################
const WellSelectorComponent = () => {
  //child ref
  const childRef = useRef();

  //redux dispatcher
  const dispatch = useDispatch();

  // Access global Redux state
  const wellSelectorState = useSelector(
    wellSelectorSlice.getWellSelectorState
  );

  //##################################################################################
  const handleModeChange = (mode) => {
    // Update Redux state
    dispatch(wellSelectorSlice.setMode(mode)); // Update Redux state
  };

  //##################################################################################
  const handleResetView = () => {
    //call child methode
    childRef.current.resetView();
  };

  //##################################################################################
  const handleRasterWidthSpinnerChange = (event) => {
    // Update the spinner value
    const value = parseFloat(event.target.value, 10);
    // Update Redux state
    dispatch(wellSelectorSlice.setRasterWidth(value));
  };

  //##################################################################################
  const handleRasterHeightSpinnerChange = (event) => {
    // Update the spinner value
    const value = parseFloat(event.target.value, 10);
    // Update Redux state
    dispatch(wellSelectorSlice.setRasterHeight(value));
  };

  //##################################################################################
  const handleOverlapWidthSpinnerChange = (event) => {
    // Update the spinner value
    const value = parseFloat(event.target.value, 10);
    // Update Redux state
    dispatch(wellSelectorSlice.setOverlapWidth(value));
  };

  //##################################################################################
  const handleOverlapHeightSpinnerChange = (event) => {
    // Update the spinner value
    const value = parseFloat(event.target.value, 10);
    // Update Redux state
    dispatch(wellSelectorSlice.setOverlapHeight(value));
  };

  //##################################################################################
  const handleNeighborsSpinnerChange = (event) => {
    // Update the spinner value
    const value = parseFloat(event.target.value, 10);
    // Update Redux state
    dispatch(wellSelectorSlice.setPointNeighbors(value));  
  };

  //##################################################################################
  return (
    <div style={{ border: "1px solid white", padding: "10px"}}>
      {/* Buttons to change base options*/}
      <div style={{ marginBottom: "10px" }}>
        {/* Buttons to change other */}
        <label style={{ fontSize: '16px' }}>Raster:</label>

        <input
          type="number"
          value={wellSelectorState.rasterHeight}
          onChange={handleRasterHeightSpinnerChange}
          min="1"
          step="5"
          style={{ marginLeft: "0px", width: "60px" }}
        />

        <input
          type="number"
          value={wellSelectorState.rasterWidth}
          onChange={handleRasterWidthSpinnerChange}
          min="1"
          step="5"
          style={{ marginRight: "10px", width: "60px" }}
        />

        <label style={{ fontSize: '16px' }}>Overlap:</label>

        <input
          type="number"
          value={wellSelectorState.overlapHeight}
          onChange={handleOverlapHeightSpinnerChange}
          min="-1"
          max="1"
          step=".1"
          style={{ marginLeft: "0px", width: "60px" }}
        />

        <input
          type="number"
          value={wellSelectorState.overlapWidth}
          onChange={handleOverlapWidthSpinnerChange}
          min="-1"
          max="1"
          step=".1"
          style={{ marginRight: "10px", width: "60px" }}
        />

        <label style={{ fontSize: '16px' }}>Neighbors:</label>

        <input
          type="number"
          value={wellSelectorState.pointNeighbors}
          onChange={handleNeighborsSpinnerChange}
          min="0"
          step="1"
          style={{ marginLeft: "0px", marginRight: "10px", width: "60px" }}
        />

        <label style={{ fontSize: '16px' }}>View:</label>

        <button onClick={() => handleResetView()}>reset view</button>
      </div> 

      {/* Buttons to change the mode */}
      <div style={{ marginBottom: "10px" }}>
        <label style={{ fontSize: '16px' }}>Modes:</label>

        <button onClick={() => handleModeChange(Mode.SINGLE_SELECT)}>
          SINGLE select
        </button>

        <button onClick={() => handleModeChange(Mode.AREA_SELECT)}>
          AREA select
        </button>

        <button onClick={() => handleModeChange(Mode.CUP_SELECT)}>
          CUP select
        </button>

        <button onClick={() => handleModeChange(Mode.MOVE_CAMERA)}>
          MOVE CAMERA
        </button>
      </div>
      {/* WellSelectorComponent with mode passed as prop width: "100%", height: "100%", display: "block"*/}
      <WellSelectorCanvas ref={childRef} style={{  }}/>
    </div>
  );
};

//##################################################################################
export default WellSelectorComponent;

import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import WellSelectorCanvas, { Mode } from "./WellSelectorCanvas.js";
import * as wsUtils from "./WellSelectorUtils.js";

import * as wellSelectorSlice from "../state/slices/WellSelectorSlice.js";
import * as experimentSlice from "../state/slices/ExperimentSlice.js";
import * as hardwareSlice from "../state/slices/HardwareSlice.js";

//##################################################################################
const WellSelectorComponent = () => {
  //child ref
  const childRef = useRef();

  //redux dispatcher
  const dispatch = useDispatch();

  // Access global Redux state
  const wellSelectorState = useSelector(wellSelectorSlice.getWellSelectorState);
  const experimentState = useSelector(experimentSlice.getExperimentState);
  const hardwareState = useSelector(hardwareSlice.getHardwareState);

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
  const handleShowOverlapChange = (event) => {
    dispatch(wellSelectorSlice.setShowOverlap(event.target.checked));
  };

  //##################################################################################
  const handleLayoutChange = (event) => {
    //select layout
    let wellLayout = wsUtils.wellLayoutEmpty;
    //check
    if (event.target.value === "layout1") {
      wellLayout = wsUtils.wellLayoutDevelopment;
    } else if (event.target.value === "layout2") {
      wellLayout = wsUtils.wellLayout32;
    } else if (event.target.value === "layout3") {
      wellLayout = wsUtils.wellLayout96;
    } 

    dispatch(experimentSlice.setWellLayout(wellLayout));
  };

  //##################################################################################
  return (
    <div style={{ border: "1px solid white", padding: "10px" }}>
      {/* Buttons to change base options*/}
      <div style={{ marginBottom: "10px" }}>
        {/* Buttons to change other */}

        <label style={{ fontSize: "16px" }}>Layout:</label>

        <select
          //value={}
          onChange={handleLayoutChange}
        >
          <option value="">--Choose an layout--</option>
          <option value="layout1">Development</option>
          <option value="layout2">Wellpalte 32</option> 
          <option value="layout3">Wellpalte 96</option> 
        </select>

        <label style={{ fontSize: "16px" }}>Raster:</label>

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

        <label style={{ fontSize: "16px" }}>Overlap:</label>

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

        <label style={{ fontSize: "16px" }}>View:</label>

        <button onClick={() => handleResetView()}>reset view</button>

        <label style={{ fontSize: "14px" }}>
          <input
            type="checkbox"
            checked={wellSelectorState.showOverlap}
            onChange={handleShowOverlapChange}
          />
          show overlap
        </label>
      </div>

      {/* Buttons to change the mode */}
      <div style={{ marginBottom: "10px" }}>
        <label style={{ fontSize: "16px" }}>Modes:</label>

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
      <WellSelectorCanvas ref={childRef} style={{}} />
    </div>
  );
};

//##################################################################################
export default WellSelectorComponent;

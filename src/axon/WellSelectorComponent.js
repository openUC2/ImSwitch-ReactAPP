import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import WellSelectorCanvas, { Mode } from "./WellSelectorCanvas.js";
import * as wsUtils from "./WellSelectorUtils.js";

import * as wellSelectorSlice from "../state/slices/WellSelectorSlice.js";
import * as experimentSlice from "../state/slices/ExperimentSlice.js";
import * as hardwareSlice from "../state/slices/HardwareSlice.js";

import {
  Button,
  Typography,
  Box,
  Input,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  ButtonGroup,
} from "@mui/material";

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
    <div style={{ border: "1px solid #eee", padding: "10px" }}>
      {/* PARAMETER */}
      <div style={{ marginBottom: "10px" }}>
        {/* LAYOUT */}

        <FormControl>
          <InputLabel>Layout</InputLabel>
          <Select label="Layout" value="empty" onChange={handleLayoutChange}>
            <MenuItem value="empty">--Choose layout--</MenuItem>
            <MenuItem value="layout1">Development</MenuItem>
            <MenuItem value="layout2">Wellpalte 32</MenuItem>
            <MenuItem value="layout3">Wellpalte 96</MenuItem>
          </Select>
        </FormControl>

        {/* OVERLAP */}

        <FormControl style={{ marginLeft: "10px", width: "80px" }}>
          <TextField
            label="Overlap X"
            type="number"
            value={wellSelectorState.overlapWidth}
            onChange={handleOverlapWidthSpinnerChange}
            inputProps={{
              min: -1,
              max: 1,
              step: 0.1,
            }}
          />
        </FormControl>

        <FormControl>
          <TextField
            label="Overlap Y"
            type="number"
            value={wellSelectorState.overlapHeight}
            onChange={handleOverlapHeightSpinnerChange}
            inputProps={{
              min: -1,
              max: 1,
              step: 0.1,
            }}
            style={{ marginRight: "10px", width: "80px" }}
          />
        </FormControl>

        {/* RASTER */}

        <FormControl>
          <TextField
            label="Raster Width"
            type="number"
            value={wellSelectorState.rasterHeight}
            onChange={handleRasterHeightSpinnerChange}
            inputProps={{
              min: 1,
              step: 5,
            }}
            style={{ marginLeft: "0px", width: "96px" }}
          />
        </FormControl>

        <FormControl>
          <TextField
            label="Raster Height"
            type="number"
            value={wellSelectorState.rasterWidth}
            onChange={handleRasterWidthSpinnerChange}
            inputProps={{
              min: 1,
              step: 5,
            }}
            style={{ marginRight: "10px", width: "96px" }}
          />
        </FormControl>

        {/* VIEW */}

        <Button variant="contained" onClick={() => handleResetView()}>
          reset view
        </Button>

        <label style={{ fontSize: "14px" }}>
          <input
            type="checkbox"
            checked={wellSelectorState.showOverlap}
            onChange={handleShowOverlapChange}
          />
          show overlap
        </label>
      </div>

      {/* MODE */}
      <div
        style={{
          marginBottom: "10px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ButtonGroup>
          <Button
            variant="contained"
            style={{}}
            onClick={() => handleModeChange(Mode.SINGLE_SELECT)}
            disabled={wellSelectorState.mode == Mode.SINGLE_SELECT}
          >
            SINGLE select
          </Button>

          <Button
            variant="contained"
            style={{}}
            onClick={() => handleModeChange(Mode.AREA_SELECT)}
            disabled={wellSelectorState.mode == Mode.AREA_SELECT}
          >
            AREA select
          </Button>

          <Button
            variant="contained"
            style={{}}
            onClick={() => handleModeChange(Mode.CUP_SELECT)}
            disabled={wellSelectorState.mode == Mode.CUP_SELECT}
          >
            CUP select
          </Button>

          <Button
            variant="contained"
            style={{}}
            onClick={() => handleModeChange(Mode.MOVE_CAMERA)}
            disabled={wellSelectorState.mode == Mode.MOVE_CAMERA}
          >
            MOVE CAMERA
          </Button>
        </ButtonGroup>
      </div>

      {/* WellSelectorComponent with mode passed as prop width: "100%", height: "100%", display: "block"*/}
      <WellSelectorCanvas ref={childRef} style={{}} />
    </div>
  );
};

//##################################################################################
export default WellSelectorComponent;

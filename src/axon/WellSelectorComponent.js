import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import WellSelectorCanvas, { Mode } from "./WellSelectorCanvas.js";

import * as wsUtils from "./WellSelectorUtils.js";

import InfoPopup from "./InfoPopup.js";


import * as wellSelectorSlice from "../state/slices/WellSelectorSlice.js";
import * as experimentSlice from "../state/slices/ExperimentSlice.js";
import * as hardwareSlice from "../state/slices/HardwareSlice.js";

import apiGetSampleLayoutFilePaths from "../backendapi/apiGetSampleLayoutFilePaths.js";
import apiDownloadJson from "../backendapi/apiDownloadJson.js";

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
  //local state
  const [wellLayoutFileList, setWellLayoutFileList] = useState([
    "image/test.json",//TODO remove test
    "image/test1.json",//TODO remove test
  ]);

  //child ref
  const childRef = useRef();//canvas 
  const infoPopupRef = useRef();

  //redux dispatcher
  const dispatch = useDispatch();

  // Access global Redux state
  const wellSelectorState = useSelector(wellSelectorSlice.getWellSelectorState);
  const experimentState = useSelector(experimentSlice.getExperimentState);
  const hardwareState = useSelector(hardwareSlice.getHardwareState);

  //##################################################################################
  useEffect(() => {
    //request welllayout file list
    apiGetSampleLayoutFilePaths()
      .then((data) => {
        //console.log("apiGetSampleLayoutFilePaths",data)
        //set file list
        setWellLayoutFileList(data);
      })
      .catch((err) => {
        //handle error if needed
        console.log(err);
      });
  }, []); // Empty dependency array ensures this runs once on mount

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
    console.log("handleLayoutChange");
    //select layout
    let wellLayout; // = wsUtils.wellLayoutDefault;

    //check defaults
    if (event.target.value === "Default") {
      wellLayout = wsUtils.wellLayoutDefault;
    } else if (event.target.value === "Development") {
      wellLayout = wsUtils.wellLayoutDevelopment;
    } else if (event.target.value === "Wellplate 32") {
      wellLayout = wsUtils.wellLayout32;
    } else if (event.target.value === "Wellplate 96") {
      wellLayout = wsUtils.wellLayout96;
    } else {
      //donwload layout
      apiDownloadJson(event.target.value) // Pass the JSON file path
        .then((data) => {
          console.log("apiDownloadJson", data);
          //handle layout
          //TODO
        //set popup
           infoPopupRef.current.showMessage("TODO impl me"); 
          console.error("-----------------------------------------------TODO impl me------------------------------------------------------------");
        })
        .catch((err) => {
          //handle error if needed
          console.log(err);
        });

      return;
    }

    //get from web
    ///TODO 
    //console.log(JSON.stringify(wsUtils.wellLayoutDevelopment));
    //console.log(JSON.stringify(wsUtils.wellLayout32));
    //console.log(JSON.stringify(wsUtils.wellLayout96));


    //set new layout
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
          <Select
            label="Layout"
            value={experimentState.wellLayout.name}
            onChange={handleLayoutChange}
          >
            {/* current layout */}
            <MenuItem
              style={{ backgroundColor: "lightblue" }}
              value={experimentState.wellLayout.name}
            >
              {experimentState.wellLayout.name}
            </MenuItem>
            {/* hard coded layouts */}
            <MenuItem value="Default">Default</MenuItem>
            <MenuItem value="Development">Development</MenuItem>
            <MenuItem value="Wellplate 32">Wellplate 32</MenuItem>
            <MenuItem value="Wellplate 96">Wellplate 96</MenuItem>
            {/* online layouts */}
            {wellLayoutFileList.map((file, index) => (
              <MenuItem value={file}>{file}</MenuItem>
            ))}
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
      <InfoPopup ref={infoPopupRef}/>
    </div>
  );
};

//##################################################################################
export default WellSelectorComponent;

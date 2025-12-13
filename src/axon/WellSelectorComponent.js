import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import WellSelectorCanvas, { Mode } from "./WellSelectorCanvas.js";

import * as wsUtils from "./WellSelectorUtils.js";

import InfoPopup from "./InfoPopup.js";


import * as wellSelectorSlice from "../state/slices/WellSelectorSlice.js";
import * as experimentSlice from "../state/slices/ExperimentSlice.js";
import * as positionSlice from "../state/slices/PositionSlice.js"; 

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
  FormControlLabel,
  ButtonGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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
  const positionState = useSelector(positionSlice.getPositionState); 


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
  const handleResetHistory = () => {
    //call child method to reset position history
    childRef.current.resetHistory();
  };

  //##################################################################################
  const handleShowOverlapChange = (event) => {
    dispatch(wellSelectorSlice.setShowOverlap(event.target.checked));
  };

  //##################################################################################
  const handleShowShapeChange = (event) => {
    dispatch(wellSelectorSlice.setShowShape(event.target.checked));
  };

  //##################################################################################
  const handleLayoutChange = (event) => {
    console.log("handleLayoutChange");
    //select layout
    let wellLayout; // = wsUtils.wellLayoutDefault;

    // Get current offsets from Redux state
    const offsetX = wellSelectorState.layoutOffsetX || 0;
    const offsetY = wellSelectorState.layoutOffsetY || 0;

    //check defaults
    if (event.target.value === "Default") {
      wellLayout = wsUtils.wellLayoutDefault;
    } else if (event.target.value === "Heidstar 4x Histosample") {
      wellLayout = wsUtils.wellLayoutDevelopment;
    } else if (event.target.value === "histolayout") {
      wellLayout = wsUtils.histolayout;
    } else if (event.target.value === "Wellplate 32") {
      wellLayout = wsUtils.wellLayout32;
    } else if (event.target.value === "Wellplate 96") {
      wellLayout = wsUtils.wellLayout96;
    } else if (event.target.value === "Wellplate 384") {
      // Generate 384 layout with offsets
      wellLayout = wsUtils.generateWellLayout384({
        offsetX: offsetX,
        offsetY: offsetY
      });
    } else if (event.target.value === "Ropod") {
      wellLayout = wsUtils.ropodLayout;      
    } else {
      //donwload layout
      apiDownloadJson(event.target.value) // Pass the JSON file path
        .then((data) => {
          console.log("apiDownloadJson", data);
          //handle layout
          //TODO
        //set popup
        if (infoPopupRef.current) {
          infoPopupRef.current.showMessage("TODO impl me");
        } 
          console.error("-----------------------------------------------TODO impl me------------------------------------------------------------");
        })
        .catch((err) => {
          //handle error if needed
          console.log(err);
        });

      return;
    }

    // Apply offsets to the layout
    wellLayout = wsUtils.applyLayoutOffset(wellLayout, offsetX, offsetY);

    //get from web
    ///TODO 
    //console.log(JSON.stringify(wsUtils.wellLayoutDevelopment));
    //console.log(JSON.stringify(wsUtils.wellLayout32));
    //console.log(JSON.stringify(wsUtils.wellLayout96));


    //set new layout
    dispatch(experimentSlice.setWellLayout(wellLayout));
  };

  //##################################################################################
  const handleAddCurrentPosition = () => {
    // Get current position from Redux state
    const currentX = positionState.x;
    const currentY = positionState.y;
    
    // Create a new point with current position
    dispatch(experimentSlice.createPoint({
      x: currentX,
      y: currentY,
      name: `Position ${experimentState.pointList.length + 1}`,
      shape: ""
    }));
    
    // Show confirmation message
    if (infoPopupRef.current) {
      infoPopupRef.current.showMessage(`Added position: X=${currentX}, Y=${currentY}`);
    }
  };

  //##################################################################################
  const handleCalibrateOffset = () => {
    // Stage offset calibration is now available via right-click context menu on the canvas.
    // Right-click on the map and select "We are here (Calibrate Offset)" to set the stage offset.
    // This uses the clicked position as the known position and transmits it to the backend
    // via the setStageOffsetAxis API (similar to StageOffsetCalibrationController.jsx).
    if (infoPopupRef.current) {
      infoPopupRef.current.showMessage("Right-click on the map where you are and select 'We are here' to calibrate the stage offset.");
    }
  }

  //##################################################################################
  const handleLayoutOffsetXChange = (event) => {
    const value = parseFloat(event.target.value);
    dispatch(wellSelectorSlice.setLayoutOffsetX(value));
    
    // Re-apply the current layout with new offset
    handleLayoutChange({ target: { value: experimentState.wellLayout.name } });
  };

  //##################################################################################
  const handleLayoutOffsetYChange = (event) => {
    const value = parseFloat(event.target.value);
    dispatch(wellSelectorSlice.setLayoutOffsetY(value));
    
    // Re-apply the current layout with new offset
    handleLayoutChange({ target: { value: experimentState.wellLayout.name } });
  };

  //##################################################################################
  const handleAreaSelectSnakescanChange = (event) => {
    dispatch(wellSelectorSlice.setAreaSelectSnakescan(event.target.checked));
  };

  //##################################################################################
  const handleAreaSelectOverlapChange = (event) => {
    const value = parseFloat(event.target.value);
    dispatch(wellSelectorSlice.setAreaSelectOverlap(value));
  };

  //##################################################################################
  const handleCupSelectShapeChange = (event) => {
    dispatch(wellSelectorSlice.setCupSelectShape(event.target.value));
  };

  //##################################################################################
  const handleCupSelectOverlapChange = (event) => {
    const value = parseFloat(event.target.value);
    dispatch(wellSelectorSlice.setCupSelectOverlap(value));
  };

  //##################################################################################
  return (
    <div style={{ border: "0px solid #eee", padding: "10px" }}>
      
        {/* LAYOUT */}
            {/* WellSelectorComponent with mode passed as prop width: "100%", height: "100%", display: "block"*/}
            <WellSelectorCanvas ref={childRef} style={{}} />

{/* PARAMETER*/}
{/* Add a little spacer between the wellselector and layout */}
<div style={{ height: "16px" }} />

{/* PARAMETER */}
{/* Add a little spacer between the wellselector and layout */}
<div style={{ marginBottom: "15px" }}>
<div/>
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
            <MenuItem value="Heidstar 4x Histosample">4 Slide Heidstar</MenuItem>
            <MenuItem value="Ropod">Ropod</MenuItem>  
            <MenuItem value="Wellplate 32">Wellplate 32</MenuItem>
            <MenuItem value="Wellplate 96">Wellplate 96</MenuItem>
            <MenuItem value="Wellplate 384">Wellplate 384</MenuItem>
            <MenuItem value="histolayout">histolayout</MenuItem>
            {/* online layouts */}
            {wellLayoutFileList.map((file, index) => (
              <MenuItem value={file}>{file}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* TILE OVERLAP SLIDER */}
        <Box sx={{ width: 250, marginLeft: "20px", marginRight: "20px" }}>
          <Typography variant="body2" gutterBottom>
            Tile Overlap: {Math.round((experimentState.parameterValue.overlapWidth || 0) * 100)}%
          </Typography>
          <Slider
            value={(experimentState.parameterValue.overlapWidth || 0) * 100}
            onChange={(e, newValue) => {
              const overlapValue = newValue / 100;
              // Update both states to keep them in sync
              dispatch(wellSelectorSlice.setOverlapWidth(overlapValue));
              dispatch(wellSelectorSlice.setOverlapHeight(overlapValue));
              dispatch(experimentSlice.setOverlapWidth(overlapValue));
              dispatch(experimentSlice.setOverlapHeight(overlapValue));
            }}
            min={0}
            max={50}
            step={5}
            marks={[
              { value: 0, label: '0%' },
              { value: 25, label: '25%' },
              { value: 50, label: '50%' },
            ]}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value}%`}
          />
        </Box>

        {/* VIEW */}

        <Button variant="contained" onClick={() => handleResetView()}>
          reset view
        </Button>

        <Button 
          variant="contained" 
          onClick={() => handleResetHistory()}
          style={{ marginLeft: "10px" }}
        >
          reset history
        </Button>

        <label style={{ fontSize: "14px" }}>
          <input
            type="checkbox"
            checked={wellSelectorState.showOverlap}
            onChange={handleShowOverlapChange}
          />
          show overlap
        </label>

        <label style={{ fontSize: "14px" }}>
          <input
            type="checkbox"
            checked={wellSelectorState.showShape}
            onChange={handleShowShapeChange}
          />
          show shape
        </label>
      </div>

      {/* ADVANCED SETTINGS */}
      <Accordion style={{ marginBottom: "10px" }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="advanced-settings-content"
          id="advanced-settings-header"
        >
          <Typography>Advanced Layout Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box display="flex" flexDirection="column" gap={2}>
            <Typography variant="body2" color="textSecondary">
              Global layout offsets (applied to all wells in micrometers):
            </Typography>
            
            <FormControl fullWidth>
              <TextField
                label="Layout Offset X (μm)"
                type="number"
                value={wellSelectorState.layoutOffsetX || 0}
                onChange={handleLayoutOffsetXChange}
                inputProps={{
                  step: 100,
                }}
                helperText="Horizontal offset for all wells (default: 0)"
              />
            </FormControl>

            <FormControl fullWidth>
              <TextField
                label="Layout Offset Y (μm)"
                type="number"
                value={wellSelectorState.layoutOffsetY || 0}
                onChange={handleLayoutOffsetYChange}
                inputProps={{
                  step: 100,
                }}
                helperText="Vertical offset for all wells (default: 0)"
              />
            </FormControl>

            <Typography variant="caption" color="textSecondary" style={{ marginTop: '8px' }}>
              Note: Changes are applied immediately to the current layout.
              For Wellplate 384, default startX=29490.625μm, startY=30688.125μm
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

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
            Well select
          </Button>

          <Button
            variant="contained"
            style={{}}
            onClick={() => handleModeChange(Mode.MOVE_CAMERA)}
            disabled={wellSelectorState.mode == Mode.MOVE_CAMERA}
          >
            MOVE CAMERA
          </Button>

          <Button
            variant="contained"
            style={{}}
            onClick={() => handleAddCurrentPosition()}
          >
            ADD CURRENT POSITION
          </Button>

          <Button
            variant="contained"
            style={{}}
            onClick={() => handleCalibrateOffset()}
          >
            CALIBRATE OFFSET
          </Button>
        </ButtonGroup>
      </div>

      {/* MODE-SPECIFIC SETTINGS */}
      {/* Area Select Settings */}
      {wellSelectorState.mode === Mode.AREA_SELECT && (
        <Box
          sx={{
            marginBottom: "15px",
            padding: "12px",
            border: (theme) => `1px solid ${theme.palette.divider}`,
            borderRadius: "4px",
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f9f9f9',
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Area Select Settings
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Snakescan checkbox */}
            <FormControlLabel
              control={
                <input
                  type="checkbox"
                  checked={wellSelectorState.areaSelectSnakescan}
                  onChange={handleAreaSelectSnakescanChange}
                />
              }
              label="Enable Snakescan Pattern"
            />
          </Box>
        </Box>
      )}

      {/* Cup/Well Select Settings */}
      {wellSelectorState.mode === Mode.CUP_SELECT && (
        <Box
          sx={{
            marginBottom: "15px",
            padding: "12px",
            border: (theme) => `1px solid ${theme.palette.divider}`,
            borderRadius: "4px",
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f9f9f9',
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Well Select Settings
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Shape selector */}
            <FormControl size="small" sx={{ width: "200px" }}>
              <InputLabel>Well Shape</InputLabel>
              <Select
                value={wellSelectorState.cupSelectShape}
                onChange={handleCupSelectShapeChange}
                label="Well Shape"
              >
                <MenuItem value="circle">Circle</MenuItem>
                <MenuItem value="rectangle">Rectangle</MenuItem>
              </Select>
              <FormHelperText>Shape pattern for well scanning</FormHelperText>
            </FormControl>
          </Box>
        </Box>
      )}

      <InfoPopup ref={infoPopupRef}/>
    </div>
  );
};

//##################################################################################
export default WellSelectorComponent;

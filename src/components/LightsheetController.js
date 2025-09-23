// src/components/LightsheetController.js
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Paper,
  Tabs,
  Tab,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
} from "@mui/material";
import { green, red } from "@mui/material/colors";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VtkViewer from "./VtkViewer.js"; // Assuming you have a VtkViewer component
import ErrorBoundary from "./ErrorBoundary";
import LiveViewControlWrapper from "../axon/LiveViewControlWrapper";
import * as lightsheetSlice from "../state/slices/LightsheetSlice.js";

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
};

const LightsheetController = ({ hostIP, hostPort }) => {
  // Redux dispatcher
  const dispatch = useDispatch();
  
  // Access global Redux state
  const lightsheetState = useSelector(lightsheetSlice.getLightsheetState);
  
  // Use Redux state instead of local useState
  const tabIndex = lightsheetState.tabIndex;
  const minPos = lightsheetState.minPos;
  const maxPos = lightsheetState.maxPos;
  const speed = lightsheetState.speed;
  const axis = lightsheetState.axis;
  const illuSource = lightsheetState.illuSource;
  const illuValue = lightsheetState.illuValue;
  const vtkImagePrimary = lightsheetState.vtkImagePrimary;
  const isRunning = lightsheetState.isRunning;

  useEffect(() => {
    const fetchLatestImagePath = async () => {
      try {
        const response = await fetch(
          `${hostIP}:${hostPort}/LightsheetController/returnLastLightsheetStackPath`
        );
        const data = await response.json();
        if (data && data.filepath) {
          /*
            const medImgReader = new MedImgReader();
            const itkImage = await medImgReader.readImage(data.filepath);
            const vtkImage = await medImgReader.convertToVtkImage(itkImage);
            dispatch(lightsheetSlice.setVtkImagePrimary(vtkImage));
            */
        }
      } catch (error) {
        console.error("Error fetching latest image path:", error);
      }
    };

    fetchLatestImagePath();
  }, [hostIP, hostPort, isRunning]);

  // Periodically check if the lightsheet is running
  useEffect(() => {
    const checkIsRunning = async () => {
      try {
        const response = await fetch(
          `${hostIP}:${hostPort}/LightsheetController/getIsLightsheetRunning`
        );
        const data = await response.json();
        dispatch(lightsheetSlice.setIsRunning(data.isRunning)); // Update the isRunning state based on the response
      } catch (error) {
        console.error("Error checking lightsheet status:", error);
      }
    };

    // Set an interval to check the status every 5 seconds
    const interval = setInterval(checkIsRunning, 5000);

    // Cleanup the interval when the component is unmounted
    return () => clearInterval(interval);
  }, [hostIP, hostPort]);

  const startScanning = () => {
    const url = `${hostIP}:${hostPort}/LightsheetController/performScanningRecording?minPos=${minPos}&maxPos=${maxPos}&speed=${speed}&axis=${axis}&illusource=${illuSource}&illuvalue=${illuValue}`;

    fetch(url, { method: "GET" })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        dispatch(lightsheetSlice.setIsRunning(true));
      })
      .catch((error) => console.error("Error:", error));
  };

  const handleTabChange = (event, newValue) => {
    dispatch(lightsheetSlice.setTabIndex(newValue));
  };

  return (
    <Paper>
      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        aria-label="Lightsheet Controller Tabs"
      >
        <Tab label="Scanning Parameters" />
        <Tab label="Galvo Scanner" />
        <Tab label="View Latest Stack" />
        <Tab label="VTK Viewer" />
      </Tabs>

      <TabPanel value={tabIndex} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <LiveViewControlWrapper />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Min Position"
              value={minPos}
              onChange={(e) => dispatch(lightsheetSlice.setMinPos(e.target.value))}
              fullWidth
              type="number"
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Max Position"
              value={maxPos}
              onChange={(e) => dispatch(lightsheetSlice.setMaxPos(e.target.value))}
              fullWidth
              type="number"
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Speed"
              value={speed}
              onChange={(e) => dispatch(lightsheetSlice.setSpeed(e.target.value))}
              fullWidth
              type="number"
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Axis"
              value={axis}
              onChange={(e) => dispatch(lightsheetSlice.setAxis(e.target.value))}
              fullWidth
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Illumination Source"
              value={illuSource}
              onChange={(e) => dispatch(lightsheetSlice.setIlluSource(e.target.value))}
              fullWidth
              type="number"
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Illumination Value"
              value={illuValue}
              onChange={(e) => dispatch(lightsheetSlice.setIlluValue(e.target.value))}
              fullWidth
              type="number"
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={startScanning}
                disabled={isRunning}
                size="large"
              >
                Start Scanning
              </Button>
              {isRunning ? (
                <CheckCircleIcon style={{ color: green[500] }} />
              ) : (
                <CancelIcon style={{ color: red[500] }} />
              )}
              <Typography variant="body2">
                {isRunning ? "Scanning in progress..." : "Ready to scan"}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabIndex} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Galvo Scanner Configuration
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <LiveViewControlWrapper />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Channel"
              value={lightsheetState.galvoChannel || 2}
              onChange={(e) => dispatch(lightsheetSlice.setGalvoChannel(parseInt(e.target.value)))}
              fullWidth
              type="number"
              variant="outlined"
              inputProps={{ min: 1, max: 2 }}
              helperText="Channel: 1 or 2"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Frequency"
              value={lightsheetState.galvoFrequency || 20}
              onChange={(e) => dispatch(lightsheetSlice.setGalvoFrequency(parseFloat(e.target.value)))}
              fullWidth
              type="number"
              variant="outlined"
              inputProps={{ min: 0, step: 0.1 }}
              helperText="Frequency (Hz)"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Offset"
              value={lightsheetState.galvoOffset || 0}
              onChange={(e) => dispatch(lightsheetSlice.setGalvoOffset(parseFloat(e.target.value)))}
              fullWidth
              type="number"
              variant="outlined"
              inputProps={{ step: 0.1 }}
              helperText="Offset value"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Amplitude"
              value={lightsheetState.galvoAmplitude || 2}
              onChange={(e) => dispatch(lightsheetSlice.setGalvoAmplitude(parseFloat(e.target.value)))}
              fullWidth
              type="number"
              variant="outlined"
              inputProps={{ min: 0, step: 0.1 }}
              helperText="Amplitude value"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Clock Divider"
              value={lightsheetState.galvoClkDiv || 0}
              onChange={(e) => dispatch(lightsheetSlice.setGalvoClkDiv(parseInt(e.target.value)))}
              fullWidth
              type="number"
              variant="outlined"
              inputProps={{ min: 0 }}
              helperText="Clock divider"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Phase"
              value={lightsheetState.galvoPhase || 0}
              onChange={(e) => dispatch(lightsheetSlice.setGalvoPhase(parseInt(e.target.value)))}
              fullWidth
              type="number"
              variant="outlined"
              helperText="Phase value"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Invert"
              value={lightsheetState.galvoInvert || 1}
              onChange={(e) => dispatch(lightsheetSlice.setGalvoInvert(parseInt(e.target.value)))}
              fullWidth
              type="number"
              variant="outlined"
              inputProps={{ min: 0, max: 1 }}
              helperText="Invert: 0 or 1"
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                const channel = lightsheetState.galvoChannel || 1;
                const frequency = lightsheetState.galvoFrequency || 10;
                const offset = lightsheetState.galvoOffset || 0;
                const amplitude = lightsheetState.galvoAmplitude || 1;
                const clk_div = lightsheetState.galvoClkDiv || 0;
                const phase = lightsheetState.galvoPhase || 0;
                const invert = lightsheetState.galvoInvert || 1;
                
                const url = `${hostIP}:${hostPort}/LightsheetController/setGalvo?channel=${channel}&frequency=${frequency}&offset=${offset}&amplitude=${amplitude}&clk_div=${clk_div}&phase=${phase}&invert=${invert}`;
                
                fetch(url, { method: "GET" })
                  .then((response) => response.json())
                  .then((data) => {
                    console.log("Galvo parameters set:", data);
                  })
                  .catch((error) => console.error("Error setting galvo parameters:", error));
              }}
              size="large"
            >
              Apply Galvo Settings
            </Button>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabIndex} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              // Use the hostIP and hostPort instead of hard-coded "localhost"
              onClick={() =>
                window.open(
                  `https://kitware.github.io/itk-vtk-viewer/app/?rotate=false&fileToLoad=${hostIP}:${hostPort}/LightsheetController/getLatestLightsheetStackAsTif`,
                  "_blank"
                )
              }
            >
              Open Lightsheet Stack Viewer (TIF stack to VTK Viewer - needs
              internet)
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="secondary"
              onClick={() =>
                window.open(
                  `${hostIP}:${hostPort}/LightsheetController/getLatestLightsheetStackAsTif`,
                  "_blank"
                )
              }
            >
              Download Latest Lightsheet Stack (TIF)
            </Button>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabIndex} index={3}>
        <ErrorBoundary>
          VTK Viewer
          <VtkViewer
            tifUrl={`${hostIP}:${hostPort}/LightsheetController/getLatestLightsheetStackAsTif`}
          />
        </ErrorBoundary>
      </TabPanel>
    </Paper>
  );
};

export default LightsheetController;

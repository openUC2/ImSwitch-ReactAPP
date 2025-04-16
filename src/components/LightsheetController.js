// src/components/LightsheetController.js
import React, { useState, useEffect } from "react";
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
  const [tabIndex, setTabIndex] = useState(0);
  const [minPos, setMinPos] = useState(0);
  const [maxPos, setMaxPos] = useState(1000);
  const [speed, setSpeed] = useState(1000);
  const [axis, setAxis] = useState("A");
  const [illuSource, setIlluSource] = useState(-1);
  const [illuValue, setIlluValue] = useState(512);
  const [vtkImagePrimary, setVtkImagePrimary] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

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
            setVtkImagePrimary(vtkImage);
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
        setIsRunning(data.isRunning); // Update the isRunning state based on the response
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
        setIsRunning(true);
      })
      .catch((error) => console.error("Error:", error));
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <Paper>
      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        aria-label="Lightsheet Controller Tabs"
      >
        <Tab label="Scanning Parameters" />
        <Tab label="View Latest Stack" />
      </Tabs>

      <TabPanel value={tabIndex} index={0}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Min Position"
              value={minPos}
              onChange={(e) => setMinPos(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Max Position"
              value={maxPos}
              onChange={(e) => setMaxPos(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Speed"
              value={speed}
              onChange={(e) => setSpeed(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Axis"
              value={axis}
              onChange={(e) => setAxis(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Illumination Source"
              value={illuSource}
              onChange={(e) => setIlluSource(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Illumination Value"
              value={illuValue}
              onChange={(e) => setIlluValue(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={startScanning}
              disabled={isRunning}
            >
              Start Scanning
            </Button>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabIndex} index={1}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={() =>
                window.open(
                  "https://kitware.github.io/itk-vtk-viewer/app/?rotate=false&fileToLoad=https://localhost:8001/LightsheetController/getLatestLightsheetStackAsTif",
                  "_blank"
                )
              }
            >
              Open Lightsheet Stack Viewer
            </Button>
          </Grid>
        </Grid>
      </TabPanel>
    </Paper>
  );
};

export default LightsheetController;

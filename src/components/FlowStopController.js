import React, { useState, useEffect } from "react";
import {
  Paper,
  Tabs,
  Tab,
  Box,
  Typography,
  TextField,
  Button,
  Slider,
  Grid,
} from "@mui/material";
import { green, red } from "@mui/material/colors";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { useWebSocket } from "../context/WebSocketContext";

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

const FlowStopController = ({ hostIP, hostPort, WindowTitle }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [timeStamp, setTimeStamp] = useState("0");
  const [experimentName, setExperimentName] = useState("Test");
  const [experimentDescription, setExperimentDescription] =
    useState("Some description");
  const [uniqueId, setUniqueId] = useState(1);
  const [numImages, setNumImages] = useState(10);
  const [volumePerImage, setVolumePerImage] = useState(1000);
  const [timeToStabilize, setTimeToStabilize] = useState(0.5);
  const [pumpSpeed, setPumpSpeed] = useState(10000);
  const [isRunning, setIsRunning] = useState(false);
  const [currentImageCount, setCurrentImageCount] = useState(0);
  const socket = useWebSocket();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(
          `${hostIP}:${hostPort}/FlowStopController/getStatus`
        );
        const data = await response.json();
        setIsRunning(data[0]);
        setCurrentImageCount(data[1]);
      } catch (error) {
        //console.error('Error fetching status:', error);
      }
    };

    const fetchExperimentParameters = async () => {
      try {
        const response = await fetch(
          `${hostIP}:${hostPort}/FlowStopController/getExperimentParameters`
        );
        const data = await response.json();
        setTimeStamp(data.timeStamp);
        setExperimentName(data.experimentName);
        setExperimentDescription("Add some description here");
        setUniqueId(parseFloat(data.uniqueId, 1));
        setNumImages(parseFloat(data.numImages, -1));
        setVolumePerImage(parseFloat(data.volumePerImage, 1000));
        setTimeToStabilize(parseFloat(data.timeToStabilize, 1));
        setPumpSpeed(parseFloat(data.pumpSpeed, 1000));
      } catch (error) {
        console.error("Error fetching experiment parameters:", error);
      }
    };

    fetchStatus();
    fetchExperimentParameters();
  }, [hostIP, hostPort]);

  // connect to the websocket
  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.name === "sigImagesTaken") {
          setCurrentImageCount(message.args.p0);
        }
      };
    }

    // Clean up the chart on component unmount
    return () => {
      if (socket) {
        socket.onmessage = null;
      }
    };
  }, [socket]);

  const startExperiment = () => {
    // https://localhost:8001/FlowStopController/startFlowStopExperimentFastAPI?timeStamp=asdf&experimentName=adf&experimentDescription=asdf&uniqueId=asdf&numImages=19&volumePerImage=199&timeToStabilize=1&delayToStart=1&frameRate=1&filePath=.%2F&fileFormat=TIF&isRecordVideo=true&pumpSpeed=10000

    const url = `${hostIP}:${hostPort}/FlowStopController/startFlowStopExperimentFastAPI?timeStamp=${timeStamp}&experimentName=${experimentName}&experimentDescription=${experimentDescription}&uniqueId=${uniqueId}&numImages=${numImages}&volumePerImage=${volumePerImage}&timeToStabilize=${timeToStabilize}&isRecordVideo=true&pumpSpeed=${pumpSpeed}`;

    fetch(url, { method: "GET" })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setIsRunning(true);
      })
      .catch((error) => console.error("Error:", error));
  };

  const stopExperiment = () => {
    const url = `${hostIP}:${hostPort}/FlowStopController/stopFlowStopExperiment`;

    fetch(url, { method: "GET" })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setIsRunning(false);
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
        aria-label="acquisition settings tabs"
      >
        <Tab label="Automatic Settings" />
        <Tab label="Manual Acquisition Settings" />
      </Tabs>

      <TabPanel value={tabIndex} index={1}>
        <Typography>Focus</Typography>
        <Slider defaultValue={30} />
        <Typography>Pump Speed</Typography>
        <Slider defaultValue={30} />
        <Button variant="contained">Snap</Button>
        <TextField label="Exposure Time" defaultValue="0.1" />
        <TextField label="Gain" defaultValue="0" />
      </TabPanel>

      <TabPanel value={tabIndex} index={0}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              style={{ marginBottom: "20px" }}
              label="Time Stamp Name"
              value={timeStamp}
              onChange={(e) => setTimeStamp(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              style={{ marginBottom: "20px" }}
              label="Experiment Name"
              value={experimentName}
              onChange={(e) => setExperimentName(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              style={{ marginBottom: "20px" }}
              label="Experiment Description"
              value={experimentDescription}
              onChange={(e) => setExperimentDescription(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              style={{ marginBottom: "20px" }}
              label="Volume Per Image"
              value={volumePerImage}
              onChange={(e) => setVolumePerImage(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              style={{ marginBottom: "20px" }}
              label="Time to stabilize"
              value={timeToStabilize}
              onChange={(e) => setTimeToStabilize(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              style={{ marginBottom: "20px" }}
              label="Pump Speed"
              value={pumpSpeed}
              onChange={(e) => setPumpSpeed(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              style={{ marginBottom: "20px" }}
              label="Number of Images"
              value={numImages}
              onChange={(e) => setNumImages(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <div>
              <Button
                style={{ marginBottom: "20px", marginRight: "10px" }}
                variant="contained"
                onClick={startExperiment}
                disabled={isRunning}
              >
                Start
              </Button>
              <Button
                style={{ marginBottom: "20px" }}
                variant="contained"
                onClick={stopExperiment}
                disabled={!isRunning}
              >
                Stop
              </Button>
            </div>
          </Grid>
          <Grid item xs={6}>
            <Box display="flex" alignItems="center">
              <Typography variant="h6">Status: </Typography>
              {isRunning ? (
                <CheckCircleIcon
                  style={{ color: green[500], marginLeft: "10px" }}
                />
              ) : (
                <CancelIcon style={{ color: red[500], marginLeft: "10px" }} />
              )}
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="h6">
              Images Taken: {currentImageCount}
            </Typography>
          </Grid>
        </Grid>
      </TabPanel>
    </Paper>
  );
};

export default FlowStopController;

import React, { useRef, useContext, useState, useEffect } from "react";
import {
  Menu as MenuIcon,
  PlayArrow,
  Stop,
  CameraAlt,
  FiberManualRecord,
  Stop as StopIcon,
} from "@mui/icons-material";
import { LiveWidgetContext } from "../context/LiveWidgetContext";
import { makeStyles } from "@mui/styles";
import {
  Box,
  Container,
  Typography,
  Button,
  Drawer,
  List,
  ListItem,
  FormControl,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Slider,
  Switch,
  Checkbox,
  Grid,
  // ... any other imports you need
} from "@mui/material";
import XYZControls from "./XYZControls"; // If needed

const useStyles = makeStyles((theme) => ({
  blinking: {
    animation: `$blinkingEffect 1s infinite`,
  },
  "@keyframes blinkingEffect": {
    "0%": { opacity: 1 },
    "50%": { opacity: 0 },
    "100%": { opacity: 1 },
  },
}));

const ControlPanel_1 = ({ hostIP, hostPort }) => {
  // Access the context using useContext
  const {
    isStreamRunning,
    setStreamRunning,
    sliderIllu1Value,
    setIllu1Slider,
    sliderIllu2Value,
    setIllu2Slider,
    sliderIllu3Value,
    setIllu3Slider,
    isIllumination1Checked,
    setisIllumination1Checked,
    isIllumination2Checked,
    setisIllumination2Checked,
    isIllumination3Checked,
    setisIllumination3Checked,
  } = useContext(LiveWidgetContext);

  // Effect that reacts on changes in the isStreamRunning state
  useEffect(() => {
    if (isStreamRunning) {
      setStreamUrl(`${hostIP}:${hostPort}/RecordingController/video_feeder`);
    } else {
      setStreamUrl("");
    }
  }, [isStreamRunning]);


  const [imjoyAPI, setImjoyAPI] = useState(null);

  useEffect(() => {
    // Function to initialize ImJoy when the script loads
    const loadImJoy = async () => {
      const app = await window.loadImJoyBasicApp({
        process_url_query: true,
        show_window_title: false,
        show_progress_bar: true,
        show_empty_window: true,
        menu_style: { position: "absolute", right: 0, top: "2px" },
        window_style: { width: "100%", height: "100%" },
        main_container: null,
        menu_container: "menu-container",
        window_manager_container: "window-container",
        imjoy_api: {}, // override some imjoy API functions here
      });

      // Store the API in state or a ref so it can be accessed later
      setImjoyAPI(app.imjoy.api);

      // Add menu item for loading new plugins
      app.addMenuItem({
        label: "➕ Load Plugin",
        callback() {
          const uri = prompt(
            `Please type an ImJoy plugin URL`,
            "https://github.com/imjoy-team/imjoy-plugins/blob/master/repository/ImageAnnotator.imjoy.html"
          );
          if (uri) app.loadPlugin(uri);
        },
      });
    };

    // Dynamically load ImJoy script and initialize the app
    const script = document.createElement("script");
    script.src = "https://lib.imjoy.io/imjoy-loader.js";
    script.async = true;
    script.onload = loadImJoy; // Call loadImJoy once the script is loaded
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script); // Clean up script on component unmount
    };
  }, []);

  const imageToImJoy = async () => {
    if (!imjoyAPI) {
      console.error("ImJoy API is not loaded yet");
      return;
    }

    try {
      const imageURL = `${hostIP}:${hostPort}/RecordingController/snapNumpyToFastAPI?resizeFactor=1` //capture?_cb=ImJoy`;  // https://localhost:8001/
      const response = await fetch(imageURL);
      const bytes = await response.arrayBuffer();

      // Load ImageJ.JS in a window
      let ij = await imjoyAPI.getWindow("ImageJ.JS");
      if (!ij) {
        ij = await imjoyAPI.createWindow({
          src: "https://ij.imjoy.io",
          name: "ImageJ.JS",
          fullscreen: true,
        });
      } else {
        await ij.show();
      }

      // Display the captured image in ImageJ
      await ij.viewImage(bytes, { name: "image.jpeg" });
    } catch (error) {
      console.error("Error sending to ImJoy:", error);
    }
  };

  const videoRef = useRef(null);
  const classes = useStyles();
  const [exposureTime, setExposureTime] = useState("");
  const [isCamSettingsAuto, setCamSettingsIsAuto] = useState(true);
  const [gain, setGain] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const snapPhoto = async (event) => {
    // https://localhost:8001/RecordingController/snapImage?output=false&toList=true
    const url = `${hostIP}:${hostPort}/RecordingController/snapImage?output=false&toList=true`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
    } catch (error) {
      console.error(
        "There has been a problem with your fetch operation: ",
        error
      );
    }
    console.log("Photo snapped");
  };

  const startRecording = () => {
    console.log("Recording started");
    setIsRecording(true);
    // https://localhost:8001/RecordingController/startRecording?mSaveFormat=4
    const url = `${hostIP}:${hostPort}/RecordingController/startRecording?mSaveFormat=4`;
    try {
      const response = fetch(url);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
    } catch (error) {
      console.error(
        "There has been a problem with your fetch operation: ",
        error
      );
    }
  };

  const stopRecording = () => {
    // https://localhost:8001/RecordingController/stopRecording
    console.log("Recording stopped");
    setIsRecording(false);
    const url = `${hostIP}:${hostPort}/RecordingController/stopRecording`;
    try {
      const response = fetch(url);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
    } catch (error) {
      console.error(
        "There has been a problem with your fetch operation: ",
        error
      );
    }
  };

  const handleCamSettingsSwitchChange = (event) => {
    setCamSettingsIsAuto(event.target.checked);
  };

  const handleExposureChange = async (event) => {
    setExposureTime(event.target.value);
    const url = `${hostIP}:${hostPort}/SettingsController/setDetectorExposureTime?exposureTime=${event.target.value}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
    } catch (error) {
      console.error(
        "There has been a problem with your fetch operation: ",
        error
      );
    }
  };

  const handleGainChange = async (event) => {
    setGain(event.target.value);
    // Additional logic to handle gain change
    const url = `${hostIP}:${hostPort}/SettingsController/setDetectorGain?gain=${event.target.value}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
    } catch (error) {
      console.error(
        "There has been a problem with your fetch operation: ",
        error
      );
    }
  };

  const handleButtonPress = async (url) => {
    try {
      const response = await fetch(url);
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleIllumination1SliderChange = async (event) => {
    setIllu1Slider(event.target.value);
    const url = `${hostIP}:${hostPort}/LaserController/setLaserValue?laserName=488%20Laser&value=${event.target.value}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
    } catch (error) {
      console.error(
        "There has been a problem with your fetch operation: ",
        error
      );
    }
  };

  const handleIllumination2SliderChange = async (event) => {
    setIllu2Slider(event.target.value);
    const url = `${hostIP}:${hostPort}/LaserController/setLaserValue?laserName=635 Laser&value=${event.target.value}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
    } catch (error) {
      console.error(
        "There has been a problem with your fetch operation: ",
        error
      );
    }
  };

  const handleIllumination3SliderChange = async (event) => {
    setIllu3Slider(event.target.value);
    const url = `${hostIP}:${hostPort}/LaserController/setLaserValue?laserName=LED&value=${event.target.value}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
    } catch (error) {
      console.error(
        "There has been a problem with your fetch operation: ",
        error
      );
    }
  };

  const handleIllumination1CheckboxChange = async (event) => {
    setisIllumination1Checked(event.target.checked);

    const activeStatus = event.target.checked ? "true" : "false";
    const url = `${hostIP}:${hostPort}/LaserController/setLaserActive?laserName=488%20Laser&active=${activeStatus}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
    } catch (error) {
      console.error(
        "There has been a problem with your fetch operation: ",
        error
      );
    }
  };

  const handleStreamToggle = () => {
    setStreamRunning(!isStreamRunning);
  };

  const handleIllumination2CheckboxChange = async (event) => {
    setisIllumination2Checked(event.target.checked);

    const activeStatus = event.target.checked ? "true" : "false";
    const url = `${hostIP}:${hostPort}/LaserController/setLaserActive?laserName=635%20Laser&active=${activeStatus}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
    } catch (error) {
      console.error(
        "There has been a problem with your fetch operation: ",
        error
      );
    }
  };
  const handleIllumination3CheckboxChange = async (event) => {
    setisIllumination3Checked(event.target.checked);

    const activeStatus = event.target.checked ? "true" : "false";
    const url = `${hostIP}:${hostPort}/LaserController/setLaserActive?laserName=LED&active=${activeStatus}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
    } catch (error) {
      console.error(
        "There has been a problem with your fetch operation: ",
        error
      );
    }
  };

  return (
    <div>
      <Container component="main" sx={{ flexGrow: 1, p: 3, pt: 10 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={8}>
            <Typography variant="h6" gutterBottom>
              Video Display
            </Typography>
            {streamUrl ? (
              <img
                style={{ width: "100%", height: "auto" }}
                autoPlay
                src={streamUrl}
                ref={videoRef}
                alt={"Live Stream"}
              ></img>
            ) : null}

            <Box mb={5}>
              <Typography variant="h6" gutterBottom>
                Stream Control
              </Typography>
              <Button
                onClick={handleStreamToggle}
                variant="contained"
                color={isStreamRunning ? "secondary" : "primary"}
              >
                {isStreamRunning ? <Stop /> : <PlayArrow />}
                {isStreamRunning ? "Stop Stream" : "Start Stream"}
              </Button>
              <Button onClick={snapPhoto}>
                <CameraAlt />
              </Button>
              <Button
                variant="contained"
                onClick={imageToImJoy}
                color="primary"
                startIcon={
                  <img
                    alt="ImJoy"
                    src="https://biii.eu/sites/default/files/2019-08/imjoy-icon.png"
                    style={{ width: 24, height: 24 }}
                  />
                }
                style={{ marginLeft: 8 }}
              >
                To ImJoy
              </Button>
              <Button
                onClick={startRecording}
                className={isRecording ? classes.blinking : ""}
              >
                <FiberManualRecord />
              </Button>
              <Button onClick={stopRecording}>
                <StopIcon />
              </Button>
              <FormControlLabel
                control={
                  <Switch
                    checked={isCamSettingsAuto}
                    onChange={handleCamSettingsSwitchChange}
                    name="cameraSettings"
                    color="primary"
                  />
                }
                label={
                  isCamSettingsAuto
                    ? "Automatic Camera Settings"
                    : "Manual Camera Settings"
                }
              />
              <TextField
                id="exposure-time"
                label="Exposure Time"
                type="number"
                value={exposureTime}
                onChange={handleExposureChange}
              />
              <TextField
                id="gain"
                label="Gain"
                type="number"
                value={gain}
                onChange={handleGainChange}
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box mb={5}>
              <Typography variant="h6" gutterBottom>
                XYZ Controls
              </Typography>
            </Box>
            <Box mb={5}>
              <XYZControls
                onButtonPress={handleButtonPress}
                hostIP={hostIP}
                hostPort={hostPort}
              />
            </Box>
            <Box mb={5}>
              <Typography variant="h6" gutterBottom>
                Illumination
              </Typography>
              <div style={{ display: "flex", alignItems: "center" }}>
                <Typography variant="h8" gutterBottom>
                  Illu 1: {sliderIllu1Value}
                </Typography>
                <Slider
                  value={sliderIllu1Value}
                  min={0}
                  max={1023}
                  onChange={handleIllumination1SliderChange}
                  aria-labelledby="continuous-slider"
                />
                <Checkbox
                  checked={isIllumination1Checked}
                  onChange={handleIllumination1CheckboxChange}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <Typography variant="h8" gutterBottom>
                  Illu 2: {sliderIllu2Value}
                </Typography>
                <Slider
                  value={sliderIllu2Value}
                  min={0}
                  max={1023}
                  onChange={handleIllumination2SliderChange}
                  aria-labelledby="continuous-slider"
                />
                <Checkbox
                  checked={isIllumination2Checked}
                  onChange={handleIllumination2CheckboxChange}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <Typography variant="h8" gutterBottom>
                  Illu 3: {sliderIllu3Value}
                </Typography>
                <Slider
                  value={sliderIllu3Value}
                  min={0}
                  max={1023}
                  onChange={handleIllumination3SliderChange}
                  aria-labelledby="continuous-slider"
                />
                <Checkbox
                  checked={isIllumination3Checked}
                  onChange={handleIllumination3CheckboxChange}
                />
              </div>
            </Box>
          </Grid>
        </Grid>
      </Container>

      <Box component="footer" p={2} mt={5} bgcolor="background.paper">
        <Typography variant="h6" align="center" fontWeight="bold">
          (C) CopyRight openUC2 GmbH (openUC2.com)
        </Typography>
      </Box>
      <div
        style={{
          width: "800px", // Set a width for the container
          height: "600px", // Set a height for the container
          border: "1px solid #ccc",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div id="menu-container" style={{ height: "50px", overflow: "hidden" }}></div>
        <div
          id="window-container"
          style={{
            width: "100%",
            height: "calc(100% - 50px)", // Remaining space after the menu
            overflow: "auto", // Allow scroll if content overflows
          }}
        ></div>
      </div>



    </div>
  );
};

export default ControlPanel_1;

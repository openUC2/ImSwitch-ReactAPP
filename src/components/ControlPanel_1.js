import React, { useRef, useState } from "react";
import { Menu as MenuIcon, PlayArrow, Stop } from "@mui/icons-material";
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
  Slider,
  Checkbox,
  // ... any other imports you need
} from "@mui/material";
import XYZControls from "./XYZControls"; // If needed

const ControlPanel_1 = ({ hostIP, hostPort }) => {
  const videoRef = useRef(null);
  const [isIllumination1Checked, setisIllumination1Checked] = useState(false);
  const [isIllumination2Checked, setisIllumination2Checked] = useState(false);
  const [isIllumination3Checked, setisIllumination3Checked] = useState(false);
  const [sliderIllu1Value, setIllu1Slider] = useState(0);
  const [sliderIllu2Value, setSlider2Value] = useState(0);
  const [sliderIllu3Value, setSlider3Value] = useState(0);
  const [exposureTime, setExposureTime] = useState("");
  const [gain, setGain] = useState("");
  const [streamUrl, setStreamUrl] = useState("");

  function startStream() {
    // Replace with the IP address of the host system
    setStreamUrl(`${hostIP}:${hostPort}/RecordingController/video_feeder`);
  }

  function pauseStream() {
    setStreamUrl("");
  }

  const handleExposureChange = async (event) => {
    setExposureTime(event.target.value);
    // Additional logic to handle exposure time change
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
    setSlider2Value(event.target.value);
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
    setSlider3Value(event.target.value);
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
  }
  return (
    <div>
      <Container component="main" sx={{ flexGrow: 1, p: 3, pt: 10 }}>
        <Typography variant="h6" gutterBottom>
          Video Display
        </Typography>
        <img
          style={{ width: "100%", height: "auto" }}
          autoPlay
          src={streamUrl}
          ref={videoRef}
        ></img>

        <Box mb={5}>
          <Typography variant="h6" gutterBottom>
            Stream Control
          </Typography>
          <Button onClick={startStream}>
            <PlayArrow />
          </Button>
          <Button onClick={pauseStream}>
            <Stop />
          </Button>
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

        <Box mt={5} mb={5}>
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
              Laser 488 nm
            </Typography>
            <Slider
              defaultValue={30}
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
              Laser 635 nm
            </Typography>
            <Slider
              defaultValue={30}
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
              LED
            </Typography>
            <Slider
              defaultValue={30}
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
      </Container>

      <Box component="footer" p={2} mt={5} bgcolor="background.paper">
        <Typography variant="h6" align="center" fontWeight="bold">
          Your Footer Text Here
        </Typography>
      </Box>

      {/* Components for Control Panel 1 */}
    </div>
  );
};

export default ControlPanel_1;

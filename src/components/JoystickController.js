import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from "@mui/material";
import { useWebSocket } from "../context/WebSocketContext";
import * as stageOffsetCalibrationSlice from "../state/slices/StageOffsetCalibrationSlice.js";

const JoystickController = ({ hostIP, hostPort }) => {
  const socket = useWebSocket();
  const dispatch = useDispatch();
  
  // Access Redux state for image display
  const stageOffsetState = useSelector(stageOffsetCalibrationSlice.getStageOffsetCalibrationState);
  const imageUrls = stageOffsetState.imageUrls;
  const detectors = stageOffsetState.detectors;
  
  // Step size states
  const [stepSizeXY, setStepSizeXY] = useState(100);
  const [stepSizeZ, setStepSizeZ] = useState(10);
  
  // Fetch the list of detectors from the server
  useEffect(() => {
    const fetchDetectorNames = async () => {
      try {
        const response = await fetch(
          `${hostIP}:${hostPort}/SettingsController/getDetectorNames`
        );
        const data = await response.json();
        dispatch(stageOffsetCalibrationSlice.setDetectors(data || []));
      } catch (error) {
        console.error("Error fetching detector names:", error);
      }
    };

    fetchDetectorNames();
  }, [hostIP, hostPort, dispatch]);

  // Handle socket signals for live stream
  useEffect(() => {
    if (!socket) return;
    const handleSignal = (rawData) => {
      try {
        const jdata = JSON.parse(rawData);
        if (jdata.name === "sigUpdateImage") {
          const detectorName = jdata.detectorname;
          const imgSrc = `data:image/jpeg;base64,${jdata.image}`;
          dispatch(stageOffsetCalibrationSlice.updateImageUrl({
            detector: detectorName,
            url: imgSrc
          }));
        }
      } catch (error) {
        console.error("Error parsing signal data:", error);
      }
    };
    socket.on("signal", handleSignal);
    return () => {
      socket.off("signal", handleSignal);
    };
  }, [socket, dispatch]);

  // Movement functions
  const moveStage = (axis, distance) => {
    fetch(
      `${hostIP}:${hostPort}/PositionerController/movePositioner?axis=${axis}&dist=${distance}&isAbsolute=false&isBlocking=false`
    )
      .then((res) => res.json())
      .catch(console.error);
  };

  const homeAxis = (axis) => {
    // Using a homing command - this may need adjustment based on your API
    fetch(
      `${hostIP}:${hostPort}/PositionerController/movePositioner?axis=${axis}&dist=0&isAbsolute=true&isBlocking=false`
    )
      .then((res) => res.json())
      .catch(console.error);
  };

  const homeAll = () => {
    homeAxis("X");
    homeAxis("Y");
    homeAxis("Z");
  };

  // Joystick click handlers
  const handleJoystickClick = (direction, stepSize) => {
    switch (direction) {
      case "Y+":
        moveStage("Y", stepSize);
        break;
      case "Y-":
        moveStage("Y", -stepSize);
        break;
      case "X+":
        moveStage("X", stepSize);
        break;
      case "X-":
        moveStage("X", -stepSize);
        break;
      case "Z+":
        moveStage("Z", stepSizeZ);
        break;
      case "Z-":
        moveStage("Z", -stepSizeZ);
        break;
      default:
        console.log("Unknown direction:", direction);
    }
  };

  return (
    <Grid container spacing={3} style={{ padding: "20px" }}>
      {/* Live Stream */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6">Live Stream</Typography>
            {imageUrls[detectors[0]] && (
              <img
                src={imageUrls[detectors[0]]}
                alt="Live Stream"
                style={{ maxWidth: "100%", maxHeight: "400px" }}
              />
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Joystick Controls */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Advanced Joystick Control
            </Typography>
            
            {/* Step Size Controls */}
            <Grid container spacing={2} style={{ marginBottom: "20px" }}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>XY Step Size</InputLabel>
                  <Select
                    value={stepSizeXY}
                    onChange={(e) => setStepSizeXY(e.target.value)}
                    label="XY Step Size"
                  >
                    <MenuItem value={1000}>1000 µm</MenuItem>
                    <MenuItem value={100}>100 µm</MenuItem>
                    <MenuItem value={10}>10 µm</MenuItem>
                    <MenuItem value={1}>1 µm</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Z Step Size</InputLabel>
                  <Select
                    value={stepSizeZ}
                    onChange={(e) => setStepSizeZ(e.target.value)}
                    label="Z Step Size"
                  >
                    <MenuItem value={100}>100 µm</MenuItem>
                    <MenuItem value={10}>10 µm</MenuItem>
                    <MenuItem value={1}>1 µm</MenuItem>
                    <MenuItem value={0.1}>0.1 µm</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Simple Button-based Joystick for now */}
            <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
              <Typography variant="h6">Joystick Controls</Typography>
              
              {/* Y+ */}
              <Button 
                variant="contained" 
                onClick={() => handleJoystickClick("Y+", stepSizeXY)}
                style={{ width: "60px", height: "40px" }}
              >
                Y+
              </Button>
              
              {/* X- and X+ */}
              <Box display="flex" gap={2} alignItems="center">
                <Button 
                  variant="contained" 
                  onClick={() => handleJoystickClick("X-", stepSizeXY)}
                  style={{ width: "60px", height: "40px" }}
                >
                  X-
                </Button>
                <Box width="60px" height="40px" display="flex" alignItems="center" justifyContent="center">
                  <Typography variant="body2">Center</Typography>
                </Box>
                <Button 
                  variant="contained" 
                  onClick={() => handleJoystickClick("X+", stepSizeXY)}
                  style={{ width: "60px", height: "40px" }}
                >
                  X+
                </Button>
              </Box>
              
              {/* Y- */}
              <Button 
                variant="contained" 
                onClick={() => handleJoystickClick("Y-", stepSizeXY)}
                style={{ width: "60px", height: "40px" }}
              >
                Y-
              </Button>

              {/* Z Controls */}
              <Box display="flex" gap={2} marginTop={2}>
                <Button 
                  variant="contained" 
                  onClick={() => handleJoystickClick("Z+", stepSizeZ)}
                  style={{ backgroundColor: "DarkSeaGreen" }}
                >
                  Z+ ({stepSizeZ})
                </Button>
                <Button 
                  variant="contained" 
                  onClick={() => handleJoystickClick("Z-", stepSizeZ)}
                  style={{ backgroundColor: "DarkSeaGreen" }}
                >
                  Z- ({stepSizeZ})
                </Button>
              </Box>
            </Box>

            {/* Manual Home Buttons */}
            <Grid container spacing={1} style={{ marginTop: "20px" }}>
              <Grid item xs={3}>
                <Button variant="outlined" fullWidth onClick={() => homeAxis("X")}>
                  Home X
                </Button>
              </Grid>
              <Grid item xs={3}>
                <Button variant="outlined" fullWidth onClick={() => homeAxis("Y")}>
                  Home Y
                </Button>
              </Grid>
              <Grid item xs={3}>
                <Button variant="outlined" fullWidth onClick={() => homeAxis("Z")}>
                  Home Z
                </Button>
              </Grid>
              <Grid item xs={3}>
                <Button variant="contained" fullWidth onClick={() => homeAll()}>
                  Home All
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default JoystickController;
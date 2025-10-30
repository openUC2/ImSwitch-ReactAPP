import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Paper, Grid, Button, Typography, TextField, Box } from "@mui/material";
import LiveViewControlWrapper from "../axon/LiveViewControlWrapper";
import ObjectiveCalibrationWizard from "./ObjectiveCalibrationWizard";
import * as objectiveSlice from "../state/slices/ObjectiveSlice.js";
import * as positionSlice from "../state/slices/PositionSlice.js";
import { getConnectionSettingsState } from "../state/slices/ConnectionSettingsSlice";
import { useTheme } from "@mui/material/styles";

import apiPositionerControllerMovePositioner from "../backendapi/apiPositionerControllerMovePositioner.js";
import apiObjectiveControllerSetPositions from "../backendapi/apiObjectiveControllerSetPositions.js";
import apiObjectiveControllerCalibrateObjective from "../backendapi/apiObjectiveControllerCalibrateObjective.js";
import apiObjectiveControllerGetCurrentObjective from "../backendapi/apiObjectiveControllerGetCurrentObjective.js";
import apiObjectiveControllerMoveToObjective from "../backendapi/apiObjectiveControllerMoveToObjective.js";
import apiObjectiveControllerGetStatus from "../backendapi/apiObjectiveControllerGetStatus.js";
import apiPositionerControllerGetPositions from "../backendapi/apiPositionerControllerGetPositions.js";
import apiSettingsControllerGetDetectorNames from "../backendapi/apiSettingsControllerGetDetectorNames.js";

import fetchObjectiveControllerGetStatus from "../middleware/fetchObjectiveControllerGetStatus.js";
import fetchObjectiveControllerGetCurrentObjective from "../middleware/fetchObjectiveControllerGetCurrentObjective.js";

const ExtendedObjectiveController = () => {
  // Get connection settings from Redux
  const connectionSettings = useSelector(getConnectionSettingsState);
  const hostIP = connectionSettings.ip;
  const hostPort = connectionSettings.apiPort;
  //redux dispatcher
  const dispatch = useDispatch();
  const theme = useTheme(); // get MUI theme for color mode

  // Access global Redux state
  const objectiveState = useSelector(objectiveSlice.getObjectiveState);
  ////const State = useSelector(Slice.getState);

  // Access state from Redux instead of local state
  const currentA = objectiveState.currentA;
  const currentZ = objectiveState.currentZ;
  const imageUrls = objectiveState.imageUrls;
  const detectors = objectiveState.detectors;
  const manualX1 = objectiveState.manualX1;
  const manualX2 = objectiveState.manualX2;
  const manualZ1 = objectiveState.manualZ1;
  const manualZ2 = objectiveState.manualZ2;

  // Local state for wizard
  const [wizardOpen, setWizardOpen] = useState(false);

  // Get positions from Redux instead of local state
  const positionState = useSelector(positionSlice.getPositionState);
  const positions = {
    X: positionState.x,
    Y: positionState.y,
    Z: positionState.z,
    A: positionState.a,
  };

  // Remove all WebSocket handlers - now handled by WebSocketHandler.js
  // - sigObjectiveChanged: Already handled in WebSocketHandler -> objectiveSlice
  // - sigUpdateImage: Already handled in WebSocketHandler -> liveStreamSlice
  // - sigUpdateMotorPosition: Already handled in WebSocketHandler -> positionSlice

  useEffect(() => {
    //fetch current objective
    fetchObjectiveControllerGetCurrentObjective(dispatch);
    //refresh status
    refreshStatus();
    // Get detector names
    apiSettingsControllerGetDetectorNames()
      .then((data) => {
        dispatch(objectiveSlice.setDetectors(data));
      })
      .catch((err) => {
        console.log("Failed to fetch detector names", err); // Handle the error
      });
  }, [hostIP, hostPort]); // on host ip/port change

  // Fetch objective status (x1 and x2) from backend
  const refreshStatus = () => {
    //request fetch status
    fetchObjectiveControllerGetStatus(dispatch);
  };

  // Calibrate objective (home) and update state
  const handleCalibrate = () => {
    //request calibrate
    apiObjectiveControllerCalibrateObjective()
      .then((data) => {
        console.info("Calibrate response");
        //fetch current objective
        fetchObjectiveControllerGetCurrentObjective(dispatch);
      })
      .catch((err) => {
        console.error("Failed to calibrate the objective"); // Handle the error
      });
  };

  // Switch objective (slot should be 1 or 2)
  const handleSwitchObjective = (slot) => {
    apiObjectiveControllerMoveToObjective(slot)
      .then((data) => {
        dispatch(objectiveSlice.setCurrentObjective(slot)); //setCurrentObjective(slot);
        refreshStatus();
      })
      .catch((err) => {
        console.error(`Error switching to objective ${slot}:`, err);
      });
  };

  // Move the objective lens via PositionerController
  const movePositioner = (dist) => {
    apiPositionerControllerMovePositioner({
      axis: "A",
      dist: dist,
      isAbsolute: false,
      isBlocking: false,
    })
      .then((positionerResponse) => {
        console.log(`Move by ${dist} successful:`, positionerResponse);
      })
      .catch((error) => {
        console.log(`Move by ${dist} error:`, error);
      });
  };

  // Set objective positions (x1 or x2) manually via backend
  const handleSetX1 = (value) => {
    //handle value
    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      console.error("Error X1 must be a number");
      return;
    }
    //api request
    apiObjectiveControllerSetPositions({
      x1: numericValue,
      isBlocking: false,
    })
      .then((data) => {
        //refresh
        refreshStatus();
      })
      .catch((err) => {
        console.error("Api eror setting X1:", err);
      });
  };

  const handleSetX2 = (value) => {
    //handle value
    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      console.error("Error X2 must be a number");
      return;
    }
    //api request
    apiObjectiveControllerSetPositions({
      x2: numericValue,
      isBlocking: false,
    })
      .then((data) => {
        //refresh
        refreshStatus();
      })
      .catch((err) => {
        console.error("Api eror setting X2:", err);
      });
  };

  const handleSetZ1 = (value) => {
    //handle value
    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      console.error("Error Z1 must be a number");
      return;
    }
    //api request
    apiObjectiveControllerSetPositions({
      z1: numericValue,
      isBlocking: false,
    })
      .then((data) => {
        //refresh
        refreshStatus();
      })
      .catch((err) => {
        console.error("Api eror setting Z1:", err);
      });
  };

  const handleSetZ2 = (value) => {
    //handle value
    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      console.error("Error Z2 must be a number");
      return;
    }
    //api request
    apiObjectiveControllerSetPositions({
      z2: numericValue,
      isBlocking: false,
    })
      .then((data) => {
        //refresh
        refreshStatus();
      })
      .catch((err) => {
        console.error("Api eror setting Z2:", err);
      });
  };

  // Read current position from PositionerController and set as X1 or X2
  const handleSetCurrentAs = async (which) => {
    apiPositionerControllerGetPositions()
      .then((data) => {
        // Handle success response
        if (data.ESP32Stage) {
          dispatch(objectiveSlice.setCurrentZ(data.ESP32Stage.Z));
          dispatch(objectiveSlice.setCurrentA(data.ESP32Stage.A));
        } else if (data.VirtualStage) {
          dispatch(objectiveSlice.setCurrentZ(data.VirtualStage.Z));
          dispatch(objectiveSlice.setCurrentA(data.VirtualStage.A));
        }
        if (which === "x1") {
          handleSetX1(currentA);
        } else if (which === "x2") {
          handleSetX2(currentA);
        } else if (which === "z1") {
          handleSetZ1(currentZ);
        } else if (which === "z2") {
          handleSetZ2(currentZ);
        }
      })
      .catch((err) => {
        console.error(`Error setting current position as ${which}:`, err);
      });
  };

  // Position updates now come automatically via WebSocketHandler -> positionSlice
  // No need to fetch positions or listen to socket events - data is in Redux

  return (
    <Paper style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>
      <Grid container spacing={3}>
        {/* Objective Information */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>
            Objective Controller
          </Typography>
          <Typography>
            <b>Current Objective:</b>{" "}
            {objectiveState.currentObjective !== null
              ? objectiveState.currentObjective
              : "Unknown"}{" "}
            ({objectiveState.objectivName || "Unknown"})
          </Typography>
          <Typography>
            <b>Pixelsize:</b>{" "}
            {objectiveState.pixelsize !== null
              ? objectiveState.pixelsize
              : "Unknown"}
            , <b>NA:</b>{" "}
            {objectiveState.NA !== null ? objectiveState.NA : "Unknown"},{" "}
            <b>Magnification:</b>{" "}
            {objectiveState.magnification !== null
              ? objectiveState.magnification
              : "Unknown"}
          </Typography>
        </Grid>

        {/* Detector Live View (Stream) and Current Positions */}
        <Grid item xs={12}>
          <Grid container spacing={2} alignItems="flex-start">
            {/* Live Stream */}
            <Grid item xs={12} md={7}>
              <Typography variant="h6" gutterBottom>
                Live Stream
              </Typography>
              <Box
                sx={{
                  border: "1px solid #ddd",
                  borderRadius: 2,
                  p: 1,
                  mb: 2,
                  maxWidth: 600,
                  maxHeight: 400,
                  overflow: "auto",
                  background: "#fafbfc",
                }}
              >
                <LiveViewControlWrapper />
              </Box>
            </Grid>
            {/* Current Positions */}
            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  border: "1px solid #eee",
                  borderRadius: 2,
                  p: 2,
                  mb: 2,
                  minWidth: 180,
                  background:
                    theme.palette.mode === "dark"
                      ? theme.palette.background.paper
                      : "#f8fafd",
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  Current Stage Positions
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography>
                    <b>X:</b>{" "}
                    {positions.X !== undefined ? positions.X : "Unknown"}
                  </Typography>
                  <Typography>
                    <b>Y:</b>{" "}
                    {positions.Y !== undefined ? positions.Y : "Unknown"}
                  </Typography>
                  <Typography>
                    <b>Z:</b>{" "}
                    {positions.Z !== undefined ? positions.Z : "Unknown"}
                  </Typography>
                  <Typography>
                    <b>A:</b>{" "}
                    {positions.A !== undefined ? positions.A : "Unknown"}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Grid>

        {/* Calibration and Switching */}
        <Grid item xs={12}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Button
                variant="contained"
                color="success"
                onClick={() => setWizardOpen(true)}
              >
                Start Calibration Wizard
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCalibrate}
              >
                Calibrate/Home Objective
              </Button>
            </Grid>
            <Grid item>
              <Button variant="outlined" onClick={refreshStatus}>
                Refresh Positions
              </Button>
            </Grid>
          </Grid>
        </Grid>

        {/* Objective Lens Movement */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Move Objective Lens (Axis A)
          </Typography>
          <Grid container spacing={1}>
            <Grid item>
              <Button variant="outlined" onClick={() => movePositioner(-100)}>
                ←← (100 steps)
              </Button>
            </Grid>
            <Grid item>
              <Button variant="outlined" onClick={() => movePositioner(-10)}>
                ← (10 steps)
              </Button>
            </Grid>
            <Grid item>
              <Button variant="outlined" onClick={() => movePositioner(10)}>
                (10 steps) →
              </Button>
            </Grid>
            <Grid item>
              <Button variant="outlined" onClick={() => movePositioner(100)}>
                (100 steps) →→
              </Button>
            </Grid>
          </Grid>
        </Grid>

        {/* Objective Positions (X1, X2, Z1, Z2) */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Objective Positions
          </Typography>
          <Grid container spacing={2}>
            {/* X1 */}
            <Grid item xs={12} md={6} lg={3}>
              <Box
                sx={{ border: "1px solid #eee", borderRadius: 2, p: 2, mb: 2 }}
              >
                <Typography variant="body1">
                  <b>X1:</b>{" "}
                  {objectiveState.posX1 !== null
                    ? objectiveState.posX1
                    : "Unknown"}
                </Typography>
                <TextField
                  label="Set X1"
                  value={manualX1}
                  onChange={(e) =>
                    dispatch(objectiveSlice.setManualX1(e.target.value))
                  }
                  size="small"
                  fullWidth
                  sx={{ my: 1 }}
                />
                <Button
                  variant="contained"
                  onClick={() => handleSetX1(manualX1)}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Set X1
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => handleSetCurrentAs("x1")}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Set Current as X1
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => handleSwitchObjective(1)}
                  fullWidth
                >
                  Switch to Objective 1
                </Button>
              </Box>
            </Grid>
            {/* X2 */}
            <Grid item xs={12} md={6} lg={3}>
              <Box
                sx={{ border: "1px solid #eee", borderRadius: 2, p: 2, mb: 2 }}
              >
                <Typography variant="body1">
                  <b>X2:</b>{" "}
                  {objectiveState.posX2 !== null
                    ? objectiveState.posX2
                    : "Unknown"}
                </Typography>
                <TextField
                  label="Set X2"
                  value={manualX2}
                  onChange={(e) =>
                    dispatch(objectiveSlice.setManualX2(e.target.value))
                  }
                  size="small"
                  fullWidth
                  sx={{ my: 1 }}
                />
                <Button
                  variant="contained"
                  onClick={() => handleSetX2(manualX2)}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Set X2
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => handleSetCurrentAs("x2")}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Set Current as X2
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => handleSwitchObjective(2)}
                  fullWidth
                >
                  Switch to Objective 2
                </Button>
              </Box>
            </Grid>
            {/* Z1 */}
            <Grid item xs={12} md={6} lg={3}>
              <Box
                sx={{ border: "1px solid #eee", borderRadius: 2, p: 2, mb: 2 }}
              >
                <Typography variant="body1">
                  <b>Z1:</b>{" "}
                  {objectiveState.posZ1 !== null
                    ? objectiveState.posZ1
                    : "Unknown"}
                </Typography>
                <TextField
                  label="Set Z1"
                  value={manualZ1}
                  onChange={(e) =>
                    dispatch(objectiveSlice.setManualZ1(e.target.value))
                  }
                  size="small"
                  fullWidth
                  sx={{ my: 1 }}
                />
                <Button
                  variant="contained"
                  onClick={() => handleSetZ1(manualZ1)}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Set Z1
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => handleSetCurrentAs("z1")}
                  fullWidth
                >
                  Set Current as Z1
                </Button>
              </Box>
            </Grid>
            {/* Z2 */}
            <Grid item xs={12} md={6} lg={3}>
              <Box
                sx={{ border: "1px solid #eee", borderRadius: 2, p: 2, mb: 2 }}
              >
                <Typography variant="body1">
                  <b>Z2:</b>{" "}
                  {objectiveState.posZ2 !== null
                    ? objectiveState.posZ2
                    : "Unknown"}
                </Typography>
                <TextField
                  label="Set Z2"
                  value={manualZ2}
                  onChange={(e) =>
                    dispatch(objectiveSlice.setManualZ2(e.target.value))
                  }
                  size="small"
                  fullWidth
                  sx={{ my: 1 }}
                />
                <Button
                  variant="contained"
                  onClick={() => handleSetZ2(manualZ2)}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Set Z2
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => handleSetCurrentAs("z2")}
                  fullWidth
                >
                  Set Current as Z2
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Calibration Wizard */}
      <ObjectiveCalibrationWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />
    </Paper>
  );
};

export default ExtendedObjectiveController;

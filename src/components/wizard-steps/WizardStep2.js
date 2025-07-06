import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  TextField,
  Alert,
} from "@mui/material";
import {
  Home as HomeIcon,
  CenterFocusStrong as CenterIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import LiveViewControlWrapper from "../../axon/LiveViewControlWrapper";
import * as objectiveSlice from "../../state/slices/ObjectiveSlice.js";

import apiPositionerControllerMovePositioner from "../../backendapi/apiPositionerControllerMovePositioner.js";
import apiObjectiveControllerCalibrateObjective from "../../backendapi/apiObjectiveControllerCalibrateObjective.js";
import apiPositionerControllerGetPositions from "../../backendapi/apiPositionerControllerGetPositions.js";
import apiObjectiveControllerSetPositions from "../../backendapi/apiObjectiveControllerSetPositions.js";
import fetchObjectiveControllerGetCurrentObjective from "../../middleware/fetchObjectiveControllerGetCurrentObjective.js";

const WizardStep2 = ({ hostIP, hostPort, onNext, onBack, activeStep, totalSteps }) => {
  const dispatch = useDispatch();
  const objectiveState = useSelector(objectiveSlice.getObjectiveState);
  
  const [isHomed, setIsHomed] = useState(false);
  const [isMovedToSlot1, setIsMovedToSlot1] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [objectiveInfo, setObjectiveInfo] = useState({
    magnification: objectiveState.magnification || '',
    name: objectiveState.objectivName || '',
    pixelsize: objectiveState.pixelsize || '',
    NA: objectiveState.NA || '',
  });

  useEffect(() => {
    // Fetch current position when component mounts
    const fetchPos = () => {
      apiPositionerControllerGetPositions()
        .then((data) => {
          if (data.ESP32Stage) {
            setCurrentPosition(data.ESP32Stage.A);
            dispatch(objectiveSlice.setCurrentA(data.ESP32Stage.A));
          } else if (data.VirtualStage) {
            setCurrentPosition(data.VirtualStage.A);
            dispatch(objectiveSlice.setCurrentA(data.VirtualStage.A));
          }
        })
        .catch((err) => {
          console.error("Error fetching current position:", err);
        });
    };
    fetchPos();
  }, [dispatch]);

  const fetchCurrentPosition = () => {
    apiPositionerControllerGetPositions()
      .then((data) => {
        if (data.ESP32Stage) {
          setCurrentPosition(data.ESP32Stage.A);
          dispatch(objectiveSlice.setCurrentA(data.ESP32Stage.A));
        } else if (data.VirtualStage) {
          setCurrentPosition(data.VirtualStage.A);
          dispatch(objectiveSlice.setCurrentA(data.VirtualStage.A));
        }
      })
      .catch((err) => {
        console.error("Error fetching current position:", err);
      });
  };

  const handleHome = () => {
    apiObjectiveControllerCalibrateObjective()
      .then((data) => {
        console.info("Calibrate/Home response");
        setIsHomed(true);
        fetchObjectiveControllerGetCurrentObjective(dispatch);
        fetchCurrentPosition();
      })
      .catch((err) => {
        console.error("Failed to calibrate the objective", err);
      });
  };

  const handleMoveToSlot1 = () => {
    if (objectiveState.posX1 !== null && objectiveState.posX1 !== undefined) {
      // Move to existing X1 position
      apiPositionerControllerMovePositioner({
        axis: "A",
        dist: objectiveState.posX1,
        isAbsolute: true,
        isBlocking: false,
      })
        .then(() => {
          setIsMovedToSlot1(true);
          fetchCurrentPosition();
        })
        .catch((err) => {
          console.error("Error moving to slot 1:", err);
        });
    } else {
      // No X1 position set, just mark as moved to slot 1
      setIsMovedToSlot1(true);
    }
  };

  const movePositioner = (dist) => {
    apiPositionerControllerMovePositioner({
      axis: "A",
      dist: dist,
      isAbsolute: false,
      isBlocking: false,
    })
      .then((positionerResponse) => {
        console.log(`Move by ${dist} successful:`, positionerResponse);
        // Update current position after move
        setTimeout(fetchCurrentPosition, 500); // Small delay to ensure position is updated
      })
      .catch((error) => {
        console.log(`Move by ${dist} error:`, error);
      });
  };

  const handleSaveX1Position = () => {
    if (currentPosition !== null) {
      // Save current position as X1 using the proper API
      apiObjectiveControllerSetPositions({
        x1: currentPosition,
        isBlocking: false,
      })
        .then((data) => {
          dispatch(objectiveSlice.setPosX1(currentPosition));
          alert(`X1 position set to: ${currentPosition}`);
        })
        .catch((err) => {
          console.error("Error setting X1:", err);
        });
    }
  };

  const handleObjectiveInfoChange = (field, value) => {
    setObjectiveInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const commitObjectiveInfo = () => {
    // Update Redux state with new objective info
    dispatch(objectiveSlice.setMagnification(parseFloat(objectiveInfo.magnification) || 0));
    dispatch(objectiveSlice.setObjectiveName(objectiveInfo.name));
    dispatch(objectiveSlice.setPixelSize(parseFloat(objectiveInfo.pixelsize) || 0));
    dispatch(objectiveSlice.setNA(parseFloat(objectiveInfo.NA) || 0));
    alert("Objective information updated");
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Step 2: Calibrate Slot 1 (X1 Position)
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Home the objective lens and then move to slot 1 position. Adjust the position to center 
        the beam spot with the crosshair center, then save the X1 position.
      </Alert>

      <Grid container spacing={3}>
        {/* Live View */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Live View
            </Typography>
            <Box sx={{ height: '400px', border: '1px solid #ccc' }}>
              <LiveViewControlWrapper />
            </Box>
          </Paper>
        </Grid>

        {/* Controls */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              <HomeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              1. Home the Objective
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleHome}
              disabled={isHomed}
              startIcon={<HomeIcon />}
            >
              {isHomed ? "Homed ✓" : "Home Objective"}
            </Button>
          </Paper>

          <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              2. Move to Slot 1
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleMoveToSlot1}
              disabled={!isHomed || isMovedToSlot1}
            >
              {isMovedToSlot1 ? "At Slot 1 ✓" : "Move to Slot 1"}
            </Button>
          </Paper>

          <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              <CenterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              3. Adjust Position
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Current Position: <strong>{currentPosition || "Unknown"}</strong>
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Use the buttons below to align the beam spot with the crosshair center:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button variant="outlined" onClick={() => movePositioner(-100)}>
                ←← (100)
              </Button>
              <Button variant="outlined" onClick={() => movePositioner(-10)}>
                ← (10)
              </Button>
              <Button variant="outlined" onClick={() => movePositioner(10)}>
                (10) →
              </Button>
              <Button variant="outlined" onClick={() => movePositioner(100)}>
                (100) →→
              </Button>
            </Box>
          </Paper>

          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              <SaveIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              4. Save X1 Position
            </Typography>
            <Button
              variant="contained"
              color="success"
              onClick={handleSaveX1Position}
              disabled={!currentPosition}
              startIcon={<SaveIcon />}
            >
              Save Current Position as X1
            </Button>
          </Paper>
        </Grid>

        {/* Objective Information */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Objective 1 Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <TextField
                  label="Magnification"
                  value={objectiveInfo.magnification}
                  onChange={(e) => handleObjectiveInfoChange('magnification', e.target.value)}
                  size="small"
                  fullWidth
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  label="Name"
                  value={objectiveInfo.name}
                  onChange={(e) => handleObjectiveInfoChange('name', e.target.value)}
                  size="small"
                  fullWidth
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  label="Pixel Size"
                  value={objectiveInfo.pixelsize}
                  onChange={(e) => handleObjectiveInfoChange('pixelsize', e.target.value)}
                  size="small"
                  fullWidth
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  label="NA"
                  value={objectiveInfo.NA}
                  onChange={(e) => handleObjectiveInfoChange('NA', e.target.value)}
                  size="small"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  onClick={commitObjectiveInfo}
                  sx={{ mt: 1 }}
                >
                  Commit Changes
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WizardStep2;
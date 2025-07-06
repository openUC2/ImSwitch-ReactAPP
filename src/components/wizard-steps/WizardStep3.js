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
  CenterFocusStrong as CenterIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import LiveViewControlWrapper from "../../axon/LiveViewControlWrapper";
import * as objectiveSlice from "../../state/slices/ObjectiveSlice.js";

import apiPositionerControllerMovePositioner from "../../backendapi/apiPositionerControllerMovePositioner.js";
import apiPositionerControllerGetPositions from "../../backendapi/apiPositionerControllerGetPositions.js";
import apiObjectiveControllerSetPositions from "../../backendapi/apiObjectiveControllerSetPositions.js";

const WizardStep3 = ({ hostIP, hostPort, onNext, onBack, activeStep, totalSteps }) => {
  const dispatch = useDispatch();
  const objectiveState = useSelector(objectiveSlice.getObjectiveState);
  
  const [isMovedToSlot2, setIsMovedToSlot2] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [objectiveInfo, setObjectiveInfo] = useState({
    magnification: objectiveState.magnification2 || '',
    name: '',
    pixelsize: '',
    NA: '',
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
    
    // Auto-move to slot 2 if X2 position is known
    if (objectiveState.posX2 !== null && objectiveState.posX2 !== undefined) {
      const moveToSlot2 = () => {
        apiPositionerControllerMovePositioner({
          axis: "A",
          dist: objectiveState.posX2,
          isAbsolute: true,
          isBlocking: false,
        })
          .then(() => {
            setIsMovedToSlot2(true);
            fetchPos();
          })
          .catch((err) => {
            console.error("Error moving to slot 2:", err);
          });
      };
      moveToSlot2();
    }
  }, [dispatch, objectiveState.posX2]);



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

  const handleMoveToSlot2 = () => {
    setIsMovedToSlot2(false); // Reset state for movement feedback
    if (objectiveState.posX2 !== null && objectiveState.posX2 !== undefined) {
      // Move to existing X2 position
      apiPositionerControllerMovePositioner({
        axis: "A",
        dist: objectiveState.posX2,
        isAbsolute: true,
        isBlocking: false,
      })
        .then(() => {
          setIsMovedToSlot2(true);
          fetchCurrentPosition();
        })
        .catch((err) => {
          console.error("Error moving to slot 2:", err);
        });
    } else {
      // No X2 position set, just mark as moved to slot 2
      setIsMovedToSlot2(true);
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

  const handleSaveX2Position = () => {
    if (currentPosition !== null) {
      // Save current position as X2 using the proper API
      apiObjectiveControllerSetPositions({
        x2: currentPosition,
        isBlocking: false,
      })
        .then((data) => {
          dispatch(objectiveSlice.setPosX2(currentPosition));
          alert(`X2 position set to: ${currentPosition}`);
        })
        .catch((err) => {
          console.error("Error setting X2:", err);
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
    // Update Redux state with new objective 2 info
    dispatch(objectiveSlice.setmagnification2(parseFloat(objectiveInfo.magnification) || 0));
    alert("Objective 2 information updated");
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Step 3: Calibrate Slot 2 (X2 Position)
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        The objective will now move to slot 2 position. Adjust the position to center 
        the beam spot with the crosshair center, then save the X2 position.
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
              1. Move to Slot 2
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleMoveToSlot2}
              disabled={false}
            >
              {isMovedToSlot2 ? "Move to Slot 2 Again" : "Move to Slot 2"}
            </Button>
          </Paper>

          <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              <CenterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              2. Adjust Position
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
              3. Save X2 Position
            </Typography>
            <Button
              variant="contained"
              color="success"
              onClick={handleSaveX2Position}
              disabled={!currentPosition}
              startIcon={<SaveIcon />}
            >
              Save Current Position as X2
            </Button>
          </Paper>
        </Grid>

        {/* Objective 2 Information */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Objective 2 Information
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

export default WizardStep3;
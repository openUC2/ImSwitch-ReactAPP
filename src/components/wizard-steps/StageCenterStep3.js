import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  Grid,
  TextField,
  Card,
  CardContent,
  Slider,
} from "@mui/material";
import {
  Map as MapIcon,
  Tune as TuneIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import * as stageCenterCalibrationSlice from "../../state/slices/StageCenterCalibrationSlice";
import StageMapVisualization from "../StageMapVisualization";

const StageCenterStep3 = ({ hostIP, hostPort, onNext, onBack, activeStep, totalSteps }) => {
  const dispatch = useDispatch();
  const stageCenterState = useSelector(stageCenterCalibrationSlice.getStageCenterCalibrationState);
  
  const {
    currentX,
    currentY,
    stageMapWidth,
    stageMapHeight,
    isLoading,
    error,
    successMessage
  } = stageCenterState;

  // Fetch current position on component mount
  useEffect(() => {
    fetchCurrentPosition();
    const interval = setInterval(fetchCurrentPosition, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchCurrentPosition = async () => {
    try {
      const response = await fetch(`${hostIP}:${hostPort}/PositionerController/getPositionerPositions`);
      const data = await response.json();
      
      if (data.ESP32Stage) {
        dispatch(stageCenterCalibrationSlice.setCurrentPosition({
          x: data.ESP32Stage.X,
          y: data.ESP32Stage.Y
        }));
      } else if (data.VirtualStage) {
        dispatch(stageCenterCalibrationSlice.setCurrentPosition({
          x: data.VirtualStage.X,
          y: data.VirtualStage.Y
        }));
      }
    } catch (error) {
      console.error("Error fetching position:", error);
    }
  };

  const handleMapWidthChange = (event, newValue) => {
    dispatch(stageCenterCalibrationSlice.setStageMapDimensions({
      width: newValue,
      height: stageMapHeight
    }));
  };

  const handleMapHeightChange = (event, newValue) => {
    dispatch(stageCenterCalibrationSlice.setStageMapDimensions({
      width: stageMapWidth,
      height: newValue
    }));
  };

  const clearMessages = () => {
    dispatch(stageCenterCalibrationSlice.clearMessages());
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 2 }}>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Step 3: Stage Map Visualization
        </Typography>
        Use the interactive stage map to visualize your current position and navigate to different areas. 
        Click anywhere on the map to move the stage to that location.
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearMessages}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={clearMessages}>
          {successMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Stage Map */}
        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                <MapIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Interactive Stage Map
              </Typography>
              
              <StageMapVisualization 
                hostIP={hostIP} 
                hostPort={hostPort} 
                width={500} 
                height={400} 
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Controls */}
        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                <TuneIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Map Settings
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Map Width (μm): {stageMapWidth}
                </Typography>
                <Slider
                  value={stageMapWidth}
                  onChange={handleMapWidthChange}
                  min={1000}
                  max={10000}
                  step={500}
                  marks={[
                    { value: 1000, label: '1mm' },
                    { value: 5000, label: '5mm' },
                    { value: 10000, label: '10mm' },
                  ]}
                  valueLabelDisplay="auto"
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Map Height (μm): {stageMapHeight}
                </Typography>
                <Slider
                  value={stageMapHeight}
                  onChange={handleMapHeightChange}
                  min={1000}
                  max={10000}
                  step={500}
                  marks={[
                    { value: 1000, label: '1mm' },
                    { value: 5000, label: '5mm' },
                    { value: 10000, label: '10mm' },
                  ]}
                  valueLabelDisplay="auto"
                />
              </Box>

              <Button
                variant="outlined"
                onClick={fetchCurrentPosition}
                disabled={isLoading}
                startIcon={<RefreshIcon />}
                fullWidth
              >
                Refresh Position
              </Button>
            </CardContent>
          </Card>

          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Position
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="X (μm)"
                    value={currentX.toFixed(1)}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={{ backgroundColor: '#f5f5f5' }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Y (μm)"
                    value={currentY.toFixed(1)}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={{ backgroundColor: '#f5f5f5' }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={1} sx={{ p: 3, mt: 3, backgroundColor: '#f8f9fa' }}>
        <Typography variant="h6" gutterBottom>
          How to Use the Stage Map
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>Navigation:</strong> Click anywhere on the grid to move the stage to that position. 
          The blue circle shows your current location, and it updates in real-time.
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>Map Scale:</strong> Adjust the map width and height using the sliders to change the 
          visible area. Smaller values show more detail, larger values show more of the stage.
        </Typography>
        <Typography variant="body2">
          <strong>Visual Feedback:</strong> Orange circles show manually set center positions, 
          and green circles show automatically detected centers (from the next step).
        </Typography>
      </Paper>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
        <Button 
          variant="outlined" 
          onClick={onBack}
          size="large"
        >
          Back
        </Button>
        <Button 
          variant="contained" 
          onClick={onNext}
          size="large"
          sx={{
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1976D2 30%, #0097A7 90%)',
            }
          }}
        >
          Next: Auto Detection
        </Button>
      </Box>
    </Box>
  );
};

export default StageCenterStep3;
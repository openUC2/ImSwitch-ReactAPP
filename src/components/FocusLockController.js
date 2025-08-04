import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  Paper, 
  Grid, 
  Button, 
  Typography, 
  TextField, 
  Box, 
  Switch,
  FormControlLabel,
  Slider,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Alert
} from "@mui/material";
import * as focusLockSlice from "../state/slices/FocusLockSlice.js";
import { useTheme } from '@mui/material/styles';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Import updated API functions
import apiFocusLockControllerFocusCalibrationStart from "../backendapi/apiFocusLockControllerFocusCalibrationStart.js";
import apiFocusLockControllerGetParamsAstigmatism from "../backendapi/apiFocusLockControllerGetParamsAstigmatism.js";
import apiFocusLockControllerReturnLastImage from "../backendapi/apiFocusLockControllerReturnLastImage.js";
import apiFocusLockControllerReturnLastCroppedImage from "../backendapi/apiFocusLockControllerReturnLastCroppedImage.js";
import apiFocusLockControllerSetCropFrameParameters from "../backendapi/apiFocusLockControllerSetCropFrameParameters.js";
import apiFocusLockControllerSetPIParameters from "../backendapi/apiFocusLockControllerSetPIParameters.js";
import apiFocusLockControllerSetParamsAstigmatism from "../backendapi/apiFocusLockControllerSetParamsAstigmatism.js";
import apiFocusLockControllerToggleFocus from "../backendapi/apiFocusLockControllerToggleFocus.js";
import apiFocusLockControllerUnlockFocus from "../backendapi/apiFocusLockControllerUnlockFocus.js";
import apiFocusLockControllerStartFocusMeasurement from "../backendapi/apiFocusLockControllerStartFocusMeasurement.js";
import apiFocusLockControllerStopFocusMeasurement from "../backendapi/apiFocusLockControllerStopFocusMeasurement.js";
import apiFocusLockControllerEnableFocusLock from "../backendapi/apiFocusLockControllerEnableFocusLock.js";
import apiFocusLockControllerGetFocusLockState from "../backendapi/apiFocusLockControllerGetFocusLockState.js";
import apiFocusLockControllerGetPIParameters from "../backendapi/apiFocusLockControllerGetPIParameters.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const FocusLockController = ({ hostIP, hostPort }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const canvasRef = useRef(null);
  const [imageScale, setImageScale] = useState(1);
  
  // Access Redux state
  const focusLockState = useSelector(focusLockSlice.getFocusLockState);
  
  // Local state for image display and crop selection
  const [cropSelection, setCropSelection] = useState({ 
    isSelecting: false, 
    startX: 0, 
    startY: 0, 
    endX: 0, 
    endY: 0 
  });

  // Polling for image updates every second using loadLastImage, similar to HistoScanController
  useEffect(() => {
    // Only poll when measuring is active
    if (!focusLockState.isMeasuring) return;
    const id = setInterval(() => {
      loadLastImage();
    }, 1000);
    return () => clearInterval(id);
  }, [focusLockState.isMeasuring, hostIP, hostPort]);

  // Load initial parameters on mount
  useEffect(() => {
    loadAstigmatismParameters();
    loadPIParameters();
    loadFocusLockState();
  }, []);

  // Load astigmatism parameters from backend
  const loadAstigmatismParameters = async () => {
    try {
      const params = await apiFocusLockControllerGetParamsAstigmatism();
      if (params) {
        dispatch(focusLockSlice.setGaussianSigma(params.gaussianSigma || 1.0));
        dispatch(focusLockSlice.setBackgroundThreshold(params.backgroundThreshold || 100.0));
        dispatch(focusLockSlice.setCropSize(params.cropSize || 100));
        dispatch(focusLockSlice.setCropCenter(params.cropCenter || [0, 0]));
      }
    } catch (error) {
      console.error("Failed to load astigmatism parameters:", error);
    }
  };

  // Load PI parameters from backend
  const loadPIParameters = async () => {
    try {
      const params = await apiFocusLockControllerGetPIParameters();
      if (params && Array.isArray(params) && params.length >= 2) {
        dispatch(focusLockSlice.setKp(params[0] || 0.1));
        dispatch(focusLockSlice.setKi(params[1] || 0.01));
      }
    } catch (error) {
      console.error("Failed to load PI parameters:", error);
    }
  };

  // Load focus lock state from backend
  const loadFocusLockState = async () => {
    try {
      const state = await apiFocusLockControllerGetFocusLockState();
      if (state) {
        dispatch(focusLockSlice.setFocusLocked(state.is_locked || false));
        dispatch(focusLockSlice.setIsCalibrating(state.is_calibrating || false));
        dispatch(focusLockSlice.setIsMeasuring(state.is_measuring || false));
      }
    } catch (error) {
      console.error("Failed to load focus lock state:", error);
    }
  };

  // Load last image from backend
  const loadLastImage = async () => {
    try {
      dispatch(focusLockSlice.setIsLoadingImage(true));
      const blob = await apiFocusLockControllerReturnLastImage();
      const dataUrl = URL.createObjectURL(blob);
      dispatch(focusLockSlice.setLastImage(dataUrl));
      dispatch(focusLockSlice.setShowImageSelector(true));
    } catch (error) {
      console.error("Failed to load last image:", error);
    } finally {
      dispatch(focusLockSlice.setIsLoadingImage(false));
    }
  };

  // Start/stop focus measurement
  const toggleFocusMeasurement = async () => {
    try {
      if (focusLockState.isMeasuring) {
        await apiFocusLockControllerStopFocusMeasurement();
        dispatch(focusLockSlice.setIsMeasuring(false));
      } else {
        await apiFocusLockControllerStartFocusMeasurement();
        dispatch(focusLockSlice.setIsMeasuring(true));
      }
    } catch (error) {
      console.error("Failed to toggle focus measurement:", error);
    }
  };

  // Handle PI parameter updates
  const updatePIParameters = async () => {
    try {
      await apiFocusLockControllerSetPIParameters({
        kp: focusLockState.kp,
        ki: focusLockState.ki
      });
    } catch (error) {
      console.error("Failed to update PI parameters:", error);
    }
  };

  // Handle astigmatism parameter updates
  const updateAstigmatismParameters = async () => {
    try {
      await apiFocusLockControllerSetParamsAstigmatism({
        gaussianSigma: focusLockState.gaussianSigma,
        backgroundThreshold: focusLockState.backgroundThreshold,
        cropSize: focusLockState.cropSize,
        cropCenter: focusLockState.cropCenter
      });
    } catch (error) {
      console.error("Failed to update astigmatism parameters:", error);
    }
  };

  // Handle crop frame parameter updates
  const updateCropFrameParameters = async () => {
    try {
      await apiFocusLockControllerSetCropFrameParameters({
        cropSize: focusLockState.cropSize,
        cropCenter: focusLockState.cropCenter
      });
    } catch (error) {
      console.error("Failed to update crop frame parameters:", error);
    }
  };

  // Reset crop coordinates
  const resetCropCoordinates = () => {
    dispatch(focusLockSlice.resetCropCenter());
    updateCropFrameParameters();
  };

  // Toggle focus lock
  const toggleFocusLock = async () => {
    try {
      await apiFocusLockControllerEnableFocusLock({ enable: !focusLockState.isFocusLocked });
      dispatch(focusLockSlice.setFocusLocked(!focusLockState.isFocusLocked));
    } catch (error) {
      console.error("Failed to toggle focus lock:", error);
    }
  };

  // Start focus calibration
  const startCalibration = async () => {
    try {
      dispatch(focusLockSlice.setIsCalibrating(true));
      await apiFocusLockControllerFocusCalibrationStart();
    } catch (error) {
      console.error("Failed to start calibration:", error);
      dispatch(focusLockSlice.setIsCalibrating(false));
    }
  };

  // Unlock focus
  const unlockFocus = async () => {
    try {
      await apiFocusLockControllerUnlockFocus();
      dispatch(focusLockSlice.setFocusLocked(false));
    } catch (error) {
      console.error("Failed to unlock focus:", error);
    }
  };

  // Chart configuration for focus values
  const chartData = {
    // Use a rolling window for the x-axis: show time (relative or absolute) for a moving/scrolling effect
    labels: focusLockState.focusTimepoints.length > 0
      ? focusLockState.focusTimepoints.map((t, i) => {
          // Show seconds since first point for a moving x-axis
          const t0 = focusLockState.focusTimepoints[0];
          return ((t - t0) / 1000).toFixed(1); // seconds
        })
      : [],
    datasets: [
      {
        label: 'Focus Value',
        data: focusLockState.focusValues,
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light,
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Real-time Focus Value Chart',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  // Handle mouse events for crop selection on image - improved to prevent dragging
  const handleImageMouseDown = (e) => {
    e.preventDefault(); // Prevent default drag behavior
    
    const currentImage = focusLockState.pollImageUrl || focusLockState.lastImage;
    if (!currentImage) return;
    
    const rect = e.target.getBoundingClientRect();
    const scaleX = e.target.naturalWidth / rect.width;
    const scaleY = e.target.naturalHeight / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setCropSelection({
      isSelecting: true,
      startX: x,
      startY: y,
      endX: x,
      endY: y
    });
  };

  const handleImageMouseMove = (e) => {
    if (!cropSelection.isSelecting) return;
    e.preventDefault();
    
    const rect = e.target.getBoundingClientRect();
    const scaleX = e.target.naturalWidth / rect.width;
    const scaleY = e.target.naturalHeight / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setCropSelection(prev => ({
      ...prev,
      endX: x,
      endY: y
    }));
  };

  const handleImageMouseUp = (e) => {
    if (!cropSelection.isSelecting) return;
    e.preventDefault();
    
    const centerX = (cropSelection.startX + cropSelection.endX) / 2;
    const centerY = (cropSelection.startY + cropSelection.endY) / 2;
    
    dispatch(focusLockSlice.setCropCenter([Math.round(centerX), Math.round(centerY)]));
    dispatch(focusLockSlice.setSelectedCropRegion(cropSelection));
    
    setCropSelection(prev => ({
      ...prev,
      isSelecting: false
    }));
    
    // Update crop parameters in backend
    updateCropFrameParameters();
  };


  const currentImage = focusLockState.pollImageUrl || focusLockState.lastImage;

  return (
    <Paper style={{ padding: "24px", maxWidth: 1400, margin: "0 auto" }}>
      <Grid container spacing={3}>
        {/* Title */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>
            Focus Lock Controller (Astigmatism-based)
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Maintain objective focus using astigmatism-based feedback control
          </Typography>
        </Grid>

        {/* Status and Controls */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Focus Lock Status" />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={focusLockState.isFocusLocked}
                      onChange={toggleFocusLock}
                      color="primary"
                    />
                  }
                  label={`Focus Lock ${focusLockState.isFocusLocked ? 'Enabled' : 'Disabled'}`}
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={focusLockState.isMeasuring}
                      onChange={toggleFocusMeasurement}
                      color="secondary"
                    />
                  }
                  label={`Measurement ${focusLockState.isMeasuring ? 'Running' : 'Stopped'}`}
                />
                
                <Typography variant="body2">
                  Current Focus Value: {focusLockState.currentFocusValue.toFixed(3)}
                </Typography>
                
                <Typography variant="body2">
                  Set Point Signal: {focusLockState.setPointSignal.toFixed(3)}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                  <Button 
                    variant="contained" 
                    onClick={startCalibration}
                    disabled={focusLockState.isCalibrating}
                    fullWidth
                  >
                    {focusLockState.isCalibrating ? 'Calibrating...' : 'Start Calibration'}
                  </Button>
                  
                  <Button 
                    variant="outlined" 
                    onClick={unlockFocus}
                    disabled={!focusLockState.isFocusLocked}
                    fullWidth
                  >
                    Unlock Focus
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Focus Value Graph */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader 
              title="Focus Value History" 
              subheader="Chart showing last 50 data points"
            />
            <CardContent>
              <Box sx={{ height: 350 }}>
                {focusLockState.focusValues.length > 0 ? (
                  <Line data={chartData} options={chartOptions} />
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%',
                    border: '2px dashed #ccc',
                    borderRadius: 1,
                    flexDirection: 'column',
                    gap: 1
                  }}>
                    <Typography variant="h6" color="textSecondary">
                      📈 Real-time Focus Value Chart
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      (Chart.js integration showing last 50 data points)
                    </Typography>
                  </Box>
                )}
              </Box>
              <Button 
                size="small" 
                onClick={() => dispatch(focusLockSlice.clearFocusHistory())}
                sx={{ mt: 1 }}
              >
                Clear History
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* PI Controller Parameters */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="PI Controller Parameters" />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography gutterBottom>Kp (Proportional): {focusLockState.kp}</Typography>
                  <Slider
                    value={focusLockState.kp}
                    onChange={(e, value) => dispatch(focusLockSlice.setKp(value))}
                    min={0.001}
                    max={1}
                    step={0.001}
                    valueLabelDisplay="auto"
                  />
                </Box>
                
                <Box>
                  <Typography gutterBottom>Ki (Integral): {focusLockState.ki}</Typography>
                  <Slider
                    value={focusLockState.ki}
                    onChange={(e, value) => dispatch(focusLockSlice.setKi(value))}
                    min={0.001}
                    max={0.1}
                    step={0.001}
                    valueLabelDisplay="auto"
                  />
                </Box>
                
                <Button variant="contained" onClick={updatePIParameters}>
                  Update PI Parameters
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Astigmatism Parameters */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Astigmatism Parameters" />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Gaussian Sigma"
                  type="number"
                  value={focusLockState.gaussianSigma}
                  onChange={(e) => dispatch(focusLockSlice.setGaussianSigma(parseFloat(e.target.value)))}
                  size="small"
                  inputProps={{ step: 0.1, min: 0.1, max: 10 }}
                />
                
                <TextField
                  label="Background Threshold"
                  type="number"
                  value={focusLockState.backgroundThreshold}
                  onChange={(e) => dispatch(focusLockSlice.setBackgroundThreshold(parseFloat(e.target.value)))}
                  size="small"
                  inputProps={{ step: 1, min: 0, max: 1000 }}
                />
                
                <TextField
                  label="Crop Size"
                  type="number"
                  value={focusLockState.cropSize}
                  onChange={(e) => dispatch(focusLockSlice.setCropSize(parseInt(e.target.value)))}
                  size="small"
                  inputProps={{ step: 1, min: 10, max: 500 }}
                />
                
                <Typography variant="body2">
                  Crop Center: [{focusLockState.cropCenter[0]}, {focusLockState.cropCenter[1]}]
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant="contained" 
                    onClick={updateAstigmatismParameters}
                    sx={{ flex: 1 }}
                  >
                    Update Astigmatism Parameters
                  </Button>
                  
                  <Button 
                    variant="outlined" 
                    onClick={resetCropCoordinates}
                    sx={{ flex: 1 }}
                  >
                    Reset Coordinates
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Image Selection and Crop Region */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Image and Crop Region Selection" 
              action={
                <Button 
                  variant="outlined" 
                  onClick={loadLastImage}
                  disabled={focusLockState.isLoadingImage}
                >
                  {focusLockState.isLoadingImage ? 'Loading...' : 'Load Last Image'}
                </Button>
              }
            />
            <CardContent>
              {currentImage ? (
                <Box sx={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                  <img
                    src={currentImage}
                    alt="Camera preview for focus analysis"
                    style={{ 
                      maxWidth: '100%', 
                      minHeight: '500px',
                      maxHeight: '700px',
                      cursor: 'crosshair',
                      border: '1px solid #ccc',
                      userSelect: 'none',
                      pointerEvents: 'auto'
                    }}
                    draggable={false}
                    onMouseDown={handleImageMouseDown}
                    onMouseMove={handleImageMouseMove}
                    onMouseUp={handleImageMouseUp}
                    onDragStart={(e) => e.preventDefault()}
                  />
                  
                  {/* Show crop selection overlay */}
                  {cropSelection.isSelecting && (
                    <div
                      style={{
                        position: 'absolute',
                        left: Math.min(cropSelection.startX / imageScale, cropSelection.endX / imageScale),
                        top: Math.min(cropSelection.startY / imageScale, cropSelection.endY / imageScale),
                        width: Math.abs(cropSelection.endX - cropSelection.startX) / imageScale,
                        height: Math.abs(cropSelection.endY - cropSelection.startY) / imageScale,
                        border: '2px dashed red',
                        backgroundColor: 'rgba(255, 0, 0, 0.1)',
                        pointerEvents: 'none'
                      }}
                    />
                  )}
                  
                  {/* Show current crop center */}
                  <div
                    style={{
                      position: 'absolute',
                      left: focusLockState.cropCenter[0] / imageScale - 5,
                      top: focusLockState.cropCenter[1] / imageScale - 5,
                      width: 10,
                      height: 10,
                      backgroundColor: 'red',
                      borderRadius: '50%',
                      pointerEvents: 'none'
                    }}
                  />
                  
                  {/* Show crop size preview */}
                  <div
                    style={{
                      position: 'absolute',
                      left: focusLockState.cropCenter[0] / imageScale - focusLockState.cropSize / 2,
                      top: focusLockState.cropCenter[1] / imageScale - focusLockState.cropSize / 2,
                      width: focusLockState.cropSize,
                      height: focusLockState.cropSize,
                      border: '2px solid blue',
                      backgroundColor: 'rgba(0, 0, 255, 0.1)',
                      pointerEvents: 'none'
                    }}
                  />
                </Box>
              ) : (
                <Box sx={{ 
                  height: 400, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '2px dashed #ccc',
                  borderRadius: 1,
                  flexDirection: 'column',
                  gap: 2
                }}>
                  <Typography variant="h6" color="textSecondary">
                    📷 Image Display Area
                  </Typography>
                  <Typography variant="body2" color="textSecondary" textAlign="center">
                    Click "Load Last Image" to view and select crop region for focus analysis<br/>
                    Interactive crop selection with mouse drag
                  </Typography>
                  {focusLockState.isMeasuring && (
                    <Typography variant="body2" color="primary">
                      Waiting for camera image...
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default FocusLockController;
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
import { useWebSocket } from "../context/WebSocketContext";
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

// Import API functions
import apiFocusLockControllerFocusCalibrationStart from "../backendapi/apiFocusLockControllerFocusCalibrationStart.js";
import apiFocusLockControllerGetParamsAstigmatism from "../backendapi/apiFocusLockControllerGetParamsAstigmatism.js";
import apiFocusLockControllerReturnLastImage from "../backendapi/apiFocusLockControllerReturnLastImage.js";
import apiFocusLockControllerReturnLastCroppedImage from "../backendapi/apiFocusLockControllerReturnLastCroppedImage.js";
import apiFocusLockControllerSetCropFrameParameters from "../backendapi/apiFocusLockControllerSetCropFrameParameters.js";
import apiFocusLockControllerSetPIParameters from "../backendapi/apiFocusLockControllerSetPIParameters.js";
import apiFocusLockControllerSetParamsAstigmatism from "../backendapi/apiFocusLockControllerSetParamsAstigmatism.js";
import apiFocusLockControllerToggleFocus from "../backendapi/apiFocusLockControllerToggleFocus.js";
import apiFocusLockControllerUnlockFocus from "../backendapi/apiFocusLockControllerUnlockFocus.js";

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
  const socket = useWebSocket();
  const canvasRef = useRef(null);
  
  // Access Redux state
  const focusLockState = useSelector(focusLockSlice.getFocusLockState);
  
  // Local state for image display and crop selection
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [cropSelection, setCropSelection] = useState({ 
    isSelecting: false, 
    startX: 0, 
    startY: 0, 
    endX: 0, 
    endY: 0 
  });

  // Handle socket updates for focus values
  useEffect(() => {
    if (!socket) return;
    
    const handleSignal = (data) => {
      try {
        const jdata = JSON.parse(data);
        if (jdata.name === "sigUpdateFocusValue") {
          // Expected: (setPointSignal, timestamp)
          const [setPointSignal, timestamp] = jdata.args;
          const focusValue = jdata.focusValue || 0; // Assuming focus value is included
          
          dispatch(focusLockSlice.addFocusValue({
            focusValue,
            setPointSignal,
            timestamp
          }));
        }
      } catch (error) {
        console.error("Error parsing focus signal data:", error);
      }
    };
    
    socket.on("signal", handleSignal);
    return () => {
      socket.off("signal", handleSignal);
    };
  }, [socket, dispatch]);

  // Load initial parameters on mount
  useEffect(() => {
    loadAstigmatismParameters();
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

  // Load last image from backend
  const loadLastImage = async () => {
    try {
      dispatch(focusLockSlice.setIsLoadingImage(true));
      const blob = await apiFocusLockControllerReturnLastImage();
      const dataUrl = URL.createObjectURL(blob);
      setImageDataUrl(dataUrl);
      dispatch(focusLockSlice.setLastImage(dataUrl));
      dispatch(focusLockSlice.setShowImageSelector(true));
    } catch (error) {
      console.error("Failed to load last image:", error);
    } finally {
      dispatch(focusLockSlice.setIsLoadingImage(false));
    }
  };

  // Handle PI parameter updates
  const updatePIParameters = async () => {
    try {
      await apiFocusLockControllerSetPIParameters({
        multiplier: focusLockState.multiplier,
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

  // Toggle focus lock
  const toggleFocusLock = async () => {
    try {
      await apiFocusLockControllerToggleFocus({ toLock: !focusLockState.isFocusLocked });
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
    } finally {
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
    labels: focusLockState.focusTimepoints.map((t, i) => i), // Use indices as labels
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
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Focus Value Over Time',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Handle mouse events for crop selection on image
  const handleImageMouseDown = (e) => {
    if (!imageDataUrl) return;
    
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
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
    
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCropSelection(prev => ({
      ...prev,
      endX: x,
      endY: y
    }));
  };

  const handleImageMouseUp = (e) => {
    if (!cropSelection.isSelecting) return;
    
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

  return (
    <Paper style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
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
        <Grid item xs={12} md={6}>
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
                
                <Typography variant="body2">
                  Current Focus Value: {focusLockState.currentFocusValue.toFixed(3)}
                </Typography>
                
                <Typography variant="body2">
                  Set Point Signal: {focusLockState.setPointSignal.toFixed(3)}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant="contained" 
                    onClick={startCalibration}
                    disabled={focusLockState.isCalibrating}
                  >
                    {focusLockState.isCalibrating ? 'Calibrating...' : 'Start Calibration'}
                  </Button>
                  
                  <Button 
                    variant="outlined" 
                    onClick={unlockFocus}
                    disabled={!focusLockState.isFocusLocked}
                  >
                    Unlock Focus
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Focus Value Graph */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Focus Value History" />
            <CardContent>
              <Box sx={{ height: 300 }}>
                {focusLockState.focusValues.length > 0 ? (
                  <Line data={chartData} options={chartOptions} />
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 10 }}>
                    No focus data available
                  </Typography>
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
                  <Typography gutterBottom>Multiplier: {focusLockState.multiplier}</Typography>
                  <Slider
                    value={focusLockState.multiplier}
                    onChange={(e, value) => dispatch(focusLockSlice.setMultiplier(value))}
                    min={0.1}
                    max={10}
                    step={0.1}
                    valueLabelDisplay="auto"
                  />
                </Box>
                
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
                
                <Button variant="contained" onClick={updateAstigmatismParameters}>
                  Update Astigmatism Parameters
                </Button>
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
              {imageDataUrl ? (
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={imageDataUrl}
                    alt="Last captured frame"
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '400px',
                      cursor: 'crosshair',
                      border: '1px solid #ccc'
                    }}
                    onMouseDown={handleImageMouseDown}
                    onMouseMove={handleImageMouseMove}
                    onMouseUp={handleImageMouseUp}
                  />
                  
                  {/* Show crop selection overlay */}
                  {cropSelection.isSelecting && (
                    <div
                      style={{
                        position: 'absolute',
                        left: Math.min(cropSelection.startX, cropSelection.endX),
                        top: Math.min(cropSelection.startY, cropSelection.endY),
                        width: Math.abs(cropSelection.endX - cropSelection.startX),
                        height: Math.abs(cropSelection.endY - cropSelection.startY),
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
                      left: focusLockState.cropCenter[0] - 5,
                      top: focusLockState.cropCenter[1] - 5,
                      width: 10,
                      height: 10,
                      backgroundColor: 'red',
                      borderRadius: '50%',
                      pointerEvents: 'none'
                    }}
                  />
                </Box>
              ) : (
                <Alert severity="info">
                  Click "Load Last Image" to view and select crop region for focus analysis
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default FocusLockController;
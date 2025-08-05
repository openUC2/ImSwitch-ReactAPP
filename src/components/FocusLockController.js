
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
import streamingPlugin from 'chartjs-plugin-streaming';  
import * as focusLockSlice from "../state/slices/FocusLockSlice.js";
import { useTheme } from '@mui/material/styles';
import 'chartjs-adapter-date-fns';
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
  Legend, 
  streamingPlugin
);

const FocusLockController = ({ hostIP, hostPort }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const retryCountRef = useRef(0);
  const imgRef = useRef(null);
  const latestFocus = useRef(0);


  const maxRetries = 3;
  const [pollingError, setPollingError] = useState(false);
  
  // Access Redux state with specific selectors for better performance
  const isMeasuring = useSelector(state => state.focusLockState.isMeasuring);
  const focusLockState = useSelector(focusLockSlice.getFocusLockState);
  
  // Local state for image display and crop selection
  const [cropSelection, setCropSelection] = useState({ 
    isSelecting: false, 
    startX: 0, 
    startY: 0, 
    endX: 0, 
    endY: 0 
  });

  // Load last image from backend - memoized to prevent unnecessary re-renders
  const loadLastImage = useCallback(async () => {
    try {
      dispatch(focusLockSlice.setIsLoadingImage(true));
      setPollingError(false);
      const blob = await apiFocusLockControllerReturnLastImage();

      // Clean up previous blob URL to prevent memory leaks
      if (focusLockState.lastImage && focusLockState.lastImage.startsWith('blob:')) {
        URL.revokeObjectURL(focusLockState.lastImage);
      }

      const dataUrl = URL.createObjectURL(blob);
      dispatch(focusLockSlice.setLastImage(dataUrl));
      dispatch(focusLockSlice.setShowImageSelector(true));

      // After image loads, set frameSize in Redux to current display size
      // This will be updated again on image onLoad event for accuracy
      setTimeout(() => {
        const img = imgRef.current;
        if (img) {
          dispatch(focusLockSlice.setFrameSize([
            img.clientWidth || img.width || img.naturalWidth,
            img.clientHeight || img.height || img.naturalHeight
          ]));
        }
      }, 100);

      // Reset retry count on success
      retryCountRef.current = 0;
    } catch (error) {
      console.error("Failed to load last image:", error);
      retryCountRef.current += 1;

      // Stop polling after max retries to prevent CPU overload
      if (retryCountRef.current >= maxRetries) {
        setPollingError(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          dispatch(focusLockSlice.setIsMeasuring(false));
        }
      }
    } finally {
      dispatch(focusLockSlice.setIsLoadingImage(false));
    }
  }, [dispatch, focusLockState.lastImage, maxRetries]);

  /** keep the latest value without causing re-renders */
  useEffect(() => { latestFocus.current = focusLockState.currentFocusValue; });

/** dataset never recreated => Chart.js keeps the stream alive */
const streamData = useMemo(() => ({
  datasets: [
    {
      label: 'Focus value',
      borderColor: theme.palette.primary.main,
      backgroundColor: theme.palette.primary.light,
      data: []                        // streaming plugin fills this in
    }
  ]
}), [theme.palette.primary.main, theme.palette.primary.light]);

/** onRefresh is called by the plugin every `refresh` ms */
const onRefresh = useCallback(chart => {
  chart.data.datasets[0].data.push({
    x: Date.now(),
    y: latestFocus.current           // current focus value
  });
}, []);

/** complete streaming config */
const streamOptions = useMemo(() => ({
  animation: false,
  scales: {
    x: {
      type: 'realtime',              // ⬅️ required
      realtime: {
        duration: 30000,             // 30 s visible
        refresh: 1000,               // add point every 1 s
        delay: 2000,                 // 2 s latency
        onRefresh
      }
    },
    y: {
      title: { display: true, text: 'Focus value' }
    }
  },
  interaction: { intersect: false },
  plugins: { legend: { position: 'top' } }
}), [onRefresh]);

  // Polling for image updates with better error handling and cleanup
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only poll when measuring is active and no polling errors
    if (!pollingError) { // isMeasuring && 
      intervalRef.current = setInterval(loadLastImage, 1000);
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isMeasuring, pollingError, loadLastImage]);

  // Load initial parameters on mount
  useEffect(() => {
    loadAstigmatismParameters();
    loadPIParameters();
    loadFocusLockState();
    
    // Cleanup blob URLs on unmount
    return () => {
      if (focusLockState.lastImage && focusLockState.lastImage.startsWith('blob:')) {
        URL.revokeObjectURL(focusLockState.lastImage);
      }
      if (focusLockState.pollImageUrl && focusLockState.pollImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(focusLockState.pollImageUrl);
      }
    };
  }, []);

  // Load astigmatism parameters from backend - memoized
  const loadAstigmatismParameters = useCallback(async () => {
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
  }, [dispatch]);

  // Load PI parameters from backend - memoized
  const loadPIParameters = useCallback(async () => {
    try {
      const params = await apiFocusLockControllerGetPIParameters();
      if (params && Array.isArray(params) && params.length >= 2) {
        dispatch(focusLockSlice.setKp(params[0] || 0.1));
        dispatch(focusLockSlice.setKi(params[1] || 0.01));
      }
    } catch (error) {
      console.error("Failed to load PI parameters:", error);
    }
  }, [dispatch]);

  // Load focus lock state from backend - memoized
  const loadFocusLockState = useCallback(async () => {
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
  }, [dispatch]);

  // Start/stop focus measurement - memoized
  const toggleFocusMeasurement = useCallback(async () => {
    try {
      if (focusLockState.isMeasuring) {
        await apiFocusLockControllerStopFocusMeasurement();
        dispatch(focusLockSlice.setIsMeasuring(false));
        // Clear any polling errors when manually stopping
        setPollingError(false);
        retryCountRef.current = 0;
      } else {
        await apiFocusLockControllerStartFocusMeasurement();
        dispatch(focusLockSlice.setIsMeasuring(true));
        setPollingError(false);
        retryCountRef.current = 0;
      }
    } catch (error) {
      console.error("Failed to toggle focus measurement:", error);
    }
  }, [focusLockState.isMeasuring, dispatch]);

  // Handle PI parameter updates - memoized
  const updatePIParameters = useCallback(async () => {
    try {
      await apiFocusLockControllerSetPIParameters({
        kp: focusLockState.kp,
        ki: focusLockState.ki
      });
    } catch (error) {
      console.error("Failed to update PI parameters:", error);
    }
  }, [focusLockState.kp, focusLockState.ki]);

  // Handle astigmatism parameter updates - memoized
  const updateAstigmatismParameters = useCallback(async () => {
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
  }, [focusLockState.gaussianSigma, focusLockState.backgroundThreshold, focusLockState.cropSize, focusLockState.cropCenter]);

  // Handle crop frame parameter updates - memoized
  // Always send cropSize as integer to match backend API signature
  // Always send frameSize as [width, height] in display coordinates
  const updateCropFrameParameters = useCallback(async () => {
    try {
      // If frameSize is not set, try to get it from the image
      let frameSize = focusLockState.frameSize;
      if (!frameSize || frameSize.length !== 2) {
        const img = imgRef.current;
        if (img) {
          frameSize = [
            img.clientWidth || img.width || img.naturalWidth,
            img.clientHeight || img.height || img.naturalHeight
          ];
        }
      }
      await apiFocusLockControllerSetCropFrameParameters({
        cropSize: Math.round(focusLockState.cropSize),
        cropCenter: focusLockState.cropCenter,
        frameSize: frameSize
      });
    } catch (error) {
      console.error("Failed to update crop frame parameters:", error);
    }
  }, [focusLockState.cropSize, focusLockState.cropCenter, focusLockState.frameSize]);

  // Reset crop coordinates - memoized
  const resetCropCoordinates = useCallback(() => {
    dispatch(focusLockSlice.resetCropCenter());
    updateCropFrameParameters();
  }, [dispatch, updateCropFrameParameters]);

  // Toggle focus lock - memoized
  const toggleFocusLock = useCallback(async () => {
    try {
      await apiFocusLockControllerEnableFocusLock({ enable: !focusLockState.isFocusLocked });
      dispatch(focusLockSlice.setFocusLocked(!focusLockState.isFocusLocked));
    } catch (error) {
      console.error("Failed to toggle focus lock:", error);
    }
  }, [focusLockState.isFocusLocked, dispatch]);

  // Start focus calibration - memoized
  const startCalibration = useCallback(async () => {
    try {
      dispatch(focusLockSlice.setIsCalibrating(true));
      await apiFocusLockControllerFocusCalibrationStart();
    } catch (error) {
      console.error("Failed to start calibration:", error);
      dispatch(focusLockSlice.setIsCalibrating(false));
    }
  }, [dispatch]);

  // Unlock focus - memoized
  const unlockFocus = useCallback(async () => {
    try {
      await apiFocusLockControllerUnlockFocus();
      dispatch(focusLockSlice.setFocusLocked(false));
    } catch (error) {
      console.error("Failed to unlock focus:", error);
    }
  }, [dispatch]);

  // Chart configuration for focus values - memoized to prevent unnecessary recalculations
  const chartData = useMemo(() => {
    // Use only the last 50 values for the chart
    const values = focusLockState.focusValues.slice(-50);
    const times = focusLockState.focusTimepoints.slice(-50);
    return {
      labels: times.length > 0
        ? times.map((t, i) => {
            const t0 = times[0];
            return ((t - t0) / 1000).toFixed(1);
          })
        : [],
      datasets: [
        {
          label: 'Focus Value',
          data: values,
          borderColor: theme.palette.primary.main,
          backgroundColor: theme.palette.primary.light,
          tension: 0.1,
        },
      ],
    };
  }, [focusLockState.focusTimepoints, focusLockState.focusValues, theme.palette.primary.main, theme.palette.primary.light]);

  // Chart options - memoized to prevent unnecessary recalculations
  const chartOptions = useMemo(() => ({
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
  }), []);

  // Handle mouse events for crop selection on image - improved to prevent dragging and memoized
  const handleImageMouseDown = useCallback((e) => {
    e.preventDefault(); // Prevent default drag behavior

    const currentImage = e.target;
    if (!currentImage) return;

    // Always use the image's natural size for coordinates
    const rect = currentImage.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * currentImage.naturalWidth) / rect.width;
    const y = ((e.clientY - rect.top) * currentImage.naturalHeight) / rect.height;

    setCropSelection({
      isSelecting: true,
      startX: x,
      startY: y,
      endX: x,
      endY: y
    });
  }, []);

  const handleImageMouseMove = useCallback((e) => {
    if (!cropSelection.isSelecting) return;
    e.preventDefault();

    const currentImage = e.target;
    const rect = currentImage.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * currentImage.naturalWidth) / rect.width;
    const y = ((e.clientY - rect.top) * currentImage.naturalHeight) / rect.height;

    setCropSelection(prev => ({
      ...prev,
      endX: x,
      endY: y
    }));
  }, [cropSelection.isSelecting]);

  const handleImageMouseUp = useCallback((e) => {
    if (!cropSelection.isSelecting) return;
    e.preventDefault();

    const currentImage = e.target;
    const rect = currentImage.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * currentImage.naturalWidth) / rect.width;
    const y = ((e.clientY - rect.top) * currentImage.naturalHeight) / rect.height;

    // Use the last mouse position as endX/endY
    const newCrop = {
      ...cropSelection,
      endX: x,
      endY: y
    };

    const centerX = (newCrop.startX + newCrop.endX) / 2;
    const centerY = (newCrop.startY + newCrop.endY) / 2;

    dispatch(focusLockSlice.setCropCenter([Math.round(centerX), Math.round(centerY)]));
    dispatch(focusLockSlice.setSelectedCropRegion(newCrop));
    // update cropSize in focusLockSlice, always as integer
    const cropSize = Math.round(Math.max(Math.abs(newCrop.endX - newCrop.startX), Math.abs(newCrop.endY - newCrop.startY)));
    dispatch(focusLockSlice.setCropSize(cropSize));

    setCropSelection(prev => ({
      ...prev,
      isSelecting: false
    }));

    // Update crop parameters in backend
    updateCropFrameParameters();
  }, [cropSelection.isSelecting, cropSelection.startX, cropSelection.endX, cropSelection.startY, cropSelection.endY, dispatch, updateCropFrameParameters]);

  // Memoize current image to prevent unnecessary recalculations
  const currentImage = useMemo(() => {
    return focusLockState.pollImageUrl || focusLockState.lastImage;
  }, [focusLockState.pollImageUrl, focusLockState.lastImage]);

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
                
                {pollingError && (
                  <Alert severity="warning" size="small">
                    Image polling stopped due to connection error. Check backend connection.
                  </Alert>
                )}
                
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
                <Line data={streamData} options={streamOptions} />
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
                       Real-time Focus Value Chart
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
                    ref={imgRef}
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
                    onLoad={e => {
                      // Update frameSize in Redux when image is loaded
                      const img = e.target;
                      dispatch(focusLockSlice.setFrameSize([
                        img.clientWidth || img.width || img.naturalWidth,
                        img.clientHeight || img.height || img.naturalHeight
                      ]));
                    }}
                  />
                  
                  {/* Show crop selection overlay */}
                  {/*
                    To ensure overlays are correctly positioned and sized regardless of image scaling,
                    we must map image pixel coordinates to display coordinates using the rendered image size.
                  */}
                  {/*
                    Use clientWidth/clientHeight for overlay scaling to match the rendered image size on all screens.
                  */}
                  <img
                    ref={canvasRef}
                    src={currentImage}
                    alt="hidden for overlay calc"
                    style={{ display: 'none' }}
                    onLoad={() => { /* trigger re-render for overlay calc */ }}
                  />
                  {(() => {
                    // Get the displayed image element
                    const img = imgRef.current;
                    if (!img) return null;
                    // Use clientWidth/clientHeight for actual rendered size
                    const dispW = img.clientWidth || img.width || img.naturalWidth;
                    const dispH = img.clientHeight || img.height || img.naturalHeight;
                    const natW = img.naturalWidth;
                    const natH = img.naturalHeight;
                    if (!natW || !natH) return null;
                    const scaleX = dispW / natW;
                    const scaleY = dispH / natH;

                    // Helper to map image pixel coordinates to display coordinates
                    const toDisplayX = x => x * scaleX;
                    const toDisplayY = y => y * scaleY;

                    // Crop selection overlay
                    let cropOverlay = null;
                    if (cropSelection.isSelecting) {
                      const left = toDisplayX(Math.min(cropSelection.startX, cropSelection.endX));
                      const top = toDisplayY(Math.min(cropSelection.startY, cropSelection.endY));
                      const width = Math.abs(toDisplayX(cropSelection.endX) - toDisplayX(cropSelection.startX));
                      const height = Math.abs(toDisplayY(cropSelection.endY) - toDisplayY(cropSelection.startY));
                      cropOverlay = (
                        <div
                          style={{
                            position: 'absolute',
                            left,
                            top,
                            width,
                            height,
                            border: '2px dashed red',
                            backgroundColor: 'rgba(255, 0, 0, 0.1)',
                            pointerEvents: 'none'
                          }}
                        />
                      );
                    }

                    // Crop center overlay
                    const centerX = toDisplayX(focusLockState.cropCenter[0]);
                    const centerY = toDisplayY(focusLockState.cropCenter[1]);
                    const cropCenterOverlay = (
                      <div
                        style={{
                          position: 'absolute',
                          left: centerX - 5,
                          top: centerY - 5,
                          width: 10,
                          height: 10,
                          backgroundColor: 'red',
                          borderRadius: '50%',
                          pointerEvents: 'none'
                        }}
                      />
                    );

                    // Crop size preview overlay
                    const cropSize = focusLockState.cropSize;
                    const cropSizeOverlay = (
                      <div
                        style={{
                          position: 'absolute',
                          left: centerX - (cropSize * scaleX) / 2,
                          top: centerY - (cropSize * scaleY) / 2,
                          width: cropSize * scaleX,
                          height: cropSize * scaleY,
                          border: '2px solid blue',
                          backgroundColor: 'rgba(0, 0, 255, 0.1)',
                          pointerEvents: 'none'
                        }}
                      />
                    );
                    return <>{cropOverlay}{cropCenterOverlay}{cropSizeOverlay}</>;
                  })()}
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
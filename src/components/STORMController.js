// src/components/STORMController.js
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Paper,
  Tabs,
  Tab,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Slider,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { green, red } from "@mui/material/colors";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useWebSocket } from "../context/WebSocketContext";
import * as stormSlice from "../state/slices/STORMSlice.js";
import * as connectionSettingsSlice from "../state/slices/ConnectionSettingsSlice.js";
import * as parameterRangeSlice from "../state/slices/ParameterRangeSlice.js";
import LiveViewControlWrapper from "../axon/LiveViewControlWrapper";
import apiSTORMControllerStart from "../backendapi/apiSTORMControllerStart.js";
import apiSTORMControllerStop from "../backendapi/apiSTORMControllerStop.js";
import apiSTORMControllerGetStatus from "../backendapi/apiSTORMControllerGetStatus.js";
import apiSTORMControllerSetParameters from "../backendapi/apiSTORMControllerSetParameters.js";
import apiSTORMControllerTriggerReconstruction from "../backendapi/apiSTORMControllerTriggerReconstruction.js";

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`storm-tabpanel-${index}`}
      aria-labelledby={`storm-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
};

// Utility function to perform min/max intensity stretch on an image
function stretchImageIntensity(imageData) {
  // Find min and max pixel values
  let min = 255,
    max = 0;
  for (let i = 0; i < imageData.data.length; i += 4) {
    const v = imageData.data[i]; // Assume grayscale PNG
    if (v < min) min = v;
    if (v > max) max = v;
  }
  // Stretch intensities
  const range = max - min || 1;
  for (let i = 0; i < imageData.data.length; i += 4) {
    const v = imageData.data[i];
    const stretched = Math.round(((v - min) / range) * 255);
    imageData.data[i] = stretched;
    imageData.data[i + 1] = stretched;
    imageData.data[i + 2] = stretched;
    // Alpha channel remains unchanged
  }
  return imageData;
}

const STORMController = ({ hostIP, hostPort, WindowTitle }) => {
  // Redux dispatcher
  const dispatch = useDispatch();

  // Access global Redux state
  const stormState = useSelector(stormSlice.getSTORMState);
  const connectionSettingsState = useSelector(
    connectionSettingsSlice.getConnectionSettingsState
  );
  const parameterRangeState = useSelector(parameterRangeSlice.getParameterRangeState);
  const liveStreamState = useSelector((state) => state.liveStreamState);

  // Local state for crop region selection and detector parameters
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [laserActiveStates, setLaserActiveStates] = useState({});
  const [detectorGain, setDetectorGain] = useState(0);
  const [cropImage, setCropImage] = useState(null); // Image for cropping that loads on mount
  // Add state for loaded image and its pixel dimensions
  const [loadedImage, setLoadedImage] = useState(null); // holds stretched PNG data URL
  const [imageDims, setImageDims] = useState({ width: 0, height: 0 });
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState({ x: 0, y: 0 });
  const [cropPreview, setCropPreview] = useState(null); // for preview rectangle
  const canvasRef = useRef(null);

  // Use Redux state instead of local useState
  const tabIndex = stormState.tabIndex;
  const experimentName = stormState.experimentName;
  const exposureTime = stormState.exposureTime;
  const cropRegion = stormState.cropRegion;
  const laserIntensities = stormState.laserIntensities;
  const isRunning = stormState.isRunning;
  const currentFrameNumber = stormState.currentFrameNumber;
  const reconstructedImage = stormState.reconstructedImage;
  const stormParameters = stormState.stormParameters;
  const isReconstructing = stormState.isReconstructing;

  // Use global live stream image
  const liveStreamImage = liveStreamState.liveViewImage;

  const socket = useWebSocket();

  // Load initial image for cropping on component mount
  useEffect(() => {
    const loadInitialCropImage = async () => {
      if (liveStreamImage) {
        setCropImage(liveStreamImage);
      } else if (connectionSettingsState.ip && connectionSettingsState.apiPort) {
        // Try to get a snapshot from the backend for initial cropping
        try {
          const response = await fetch(
            `${connectionSettingsState.ip}:${connectionSettingsState.apiPort}/DetectorController/getLatestDetectorFrame`
          );
          if (response.ok) {
            const blob = await response.blob();
            const dataUrl = URL.createObjectURL(blob);
            setCropImage(dataUrl);
          }
        } catch (error) {
          console.warn("Could not load initial crop image:", error);
          // Use a placeholder or the current live stream image
          if (liveStreamImage) setCropImage(liveStreamImage);
        }
      }
    };

    loadInitialCropImage();
  }, [liveStreamImage, connectionSettingsState.ip, connectionSettingsState.apiPort]);

  // Fetch initial detector gain on component mount
  useEffect(() => {
    const fetchDetectorGain = async () => {
      if (connectionSettingsState.ip && connectionSettingsState.apiPort) {
        try {
          const response = await fetch(
            `${connectionSettingsState.ip}:${connectionSettingsState.apiPort}/SettingsController/getDetectorParameters`
          );
          if (response.ok) {
            const data = await response.json();
            setDetectorGain(data.gain || 0);
          }
        } catch (error) {
          console.error("Error fetching detector gain:", error);
        }
      }
    };

    fetchDetectorGain();
  }, [connectionSettingsState.ip, connectionSettingsState.apiPort]);

  // Fetch initial status on component mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await apiSTORMControllerGetStatus();
        dispatch(stormSlice.setIsRunning(data.isRunning || false));
        dispatch(stormSlice.setCurrentFrameNumber(data.currentFrame || 0));
      } catch (error) {
        console.error('Error fetching STORM status:', error);
      }
    };

    fetchStatus();
  }, [dispatch]);

  // Initialize laser intensities when parameter range is available
  useEffect(() => {
    if (parameterRangeState.illuSources.length > 0) {
      const initializeLasers = async () => {
        const initialLaserIntensities = {};
        const initialLaserActiveStates = {};
        
        // Initialize all lasers with 0 if not already set
        parameterRangeState.illuSources.forEach((laserName) => {
          if (!(laserName in laserIntensities)) {
            initialLaserIntensities[laserName] = 0;
          }
          if (!(laserName in laserActiveStates)) {
            initialLaserActiveStates[laserName] = false;
          }
        });
        
        // Fetch current laser values from backend
        if (connectionSettingsState.ip && connectionSettingsState.apiPort) {
          try {
            const laserValues = await Promise.all(
              parameterRangeState.illuSources.map(async (laserName) => {
                try {
                  const encodedLaserName = encodeURIComponent(laserName);
                  const response = await fetch(
                    `${connectionSettingsState.ip}:${connectionSettingsState.apiPort}/LaserController/getLaserValue?laserName=${encodedLaserName}`
                  );
                  
                  if (response.ok) {
                    const value = await response.json();
                    return { laserName, value: typeof value === 'number' ? value : 0 };
                  }
                } catch (error) {
                  console.warn(`Failed to fetch value for laser ${laserName}:`, error);
                }
                return { laserName, value: 0 };
              })
            );
            
            // Build laser intensities object
            const fetchedIntensities = {};
            laserValues.forEach(({ laserName, value }) => {
              fetchedIntensities[laserName] = value;
            });
            
            dispatch(stormSlice.setLaserIntensities({
              ...laserIntensities,
              ...initialLaserIntensities,
              ...fetchedIntensities
            }));
            
            setLaserActiveStates({
              ...laserActiveStates,
              ...initialLaserActiveStates
            });
          } catch (error) {
            console.error("Failed to fetch laser values:", error);
            // Just use initial values
            dispatch(stormSlice.setLaserIntensities({
              ...laserIntensities,
              ...initialLaserIntensities
            }));
            setLaserActiveStates({
              ...laserActiveStates,
              ...initialLaserActiveStates
            });
          }
        } else {
          // No connection, just use initial values
          dispatch(stormSlice.setLaserIntensities({
            ...laserIntensities,
            ...initialLaserIntensities
          }));
          setLaserActiveStates({
            ...laserActiveStates,
            ...initialLaserActiveStates
          });
        }
      };
      
      initializeLasers();
    }
  }, [dispatch, parameterRangeState.illuSources, connectionSettingsState.ip, connectionSettingsState.apiPort]);

  // WebSocket integration for STORM-specific experiment status signals
  useEffect(() => {
    if (!socket) return;

    const handleSignal = (data) => {
      try {
        const jdata = JSON.parse(data);
        
        // Handle STORM experiment status changes
        if (jdata.name === "sigSTORMExperimentStarted") {
          dispatch(stormSlice.setIsRunning(true));
        }
        
        if (jdata.name === "sigSTORMExperimentStopped") {
          dispatch(stormSlice.setIsRunning(false));
        }
      } catch (error) {
        console.error("Error parsing STORM signal data:", error);
      }
    };

    socket.on("signal", handleSignal);
    
    return () => {
      socket.off("signal", handleSignal);
    };
  }, [socket, dispatch]);

  // Start STORM experiment
  const startExperiment = async () => {
    try {
      const params = {
        session_id: experimentName,
        crop_x: cropRegion.x,
        crop_y: cropRegion.y,
        crop_width: cropRegion.width,
        crop_height: cropRegion.height,
        exposure_time: exposureTime,
        saveDirectory: "STORM",
        save_format: "tiff",
        max_frames: -1,
        process_arkitekt: false
      };
      
      await apiSTORMControllerStart(params);
      dispatch(stormSlice.setIsRunning(true));
    } catch (error) {
      console.error("Error starting STORM experiment:", error);
    }
  };

  // Stop STORM experiment
  const stopExperiment = async () => {
    try {
      await apiSTORMControllerStop();
      dispatch(stormSlice.setIsRunning(false));
    } catch (error) {
      console.error("Error stopping STORM experiment:", error);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    dispatch(stormSlice.setTabIndex(newValue));
  };

  // --- Exposure Time and Gain boundaries from parameterRangeState ---
  const minExposure = parameterRangeState?.exposureTimeMin ?? 1;
  const maxExposure = parameterRangeState?.exposureTimeMax ?? 1000;
  const minGain = parameterRangeState?.detectorGainMin ?? 0;
  const maxGain = parameterRangeState?.detectorGainMax ?? 100;

  // --- Synchronized Exposure Time ---
  const setExposureTime = async (value) => {
    // Clamp value to min/max
    let newValue = Math.max(minExposure, Math.min(maxExposure, Number(value)));
    dispatch(stormSlice.setExposureTime(newValue));
    // Update backend immediately
    if (connectionSettingsState.ip && connectionSettingsState.apiPort) {
      try {
        await fetch(
          `${connectionSettingsState.ip}:${connectionSettingsState.apiPort}/SettingsController/setExposureTime?exposureTime=${newValue}`
        );
      } catch (error) {
        console.error("Failed to update exposure time in backend:", error);
      }
    }
  };

  // Handle laser intensity changes
  const setLaserIntensity = async (laserName, value) => {
    dispatch(stormSlice.setLaserIntensity({ laserName, intensity: value }));
    
    // Also update backend immediately if connected
    if (connectionSettingsState.ip && connectionSettingsState.apiPort) {
      try {
        const encodedLaserName = encodeURIComponent(laserName);
        await fetch(
          `${connectionSettingsState.ip}:${connectionSettingsState.apiPort}/LaserController/setLaserValue?laserName=${encodedLaserName}&value=${value}`
        );
      } catch (error) {
        console.error("Failed to update laser intensity in backend:", error);
      }
    }
  };

  // Handle laser active state changes
  const setLaserActive = async (laserName, active) => {
    setLaserActiveStates(prev => ({ ...prev, [laserName]: active }));
    
    // Also update backend immediately if connected
    if (connectionSettingsState.ip && connectionSettingsState.apiPort) {
      try {
        const encodedLaserName = encodeURIComponent(laserName);
        await fetch(
          `${connectionSettingsState.ip}:${connectionSettingsState.apiPort}/LaserController/setLaserActive?laserName=${encodedLaserName}&active=${active}`
        );
      } catch (error) {
        console.error("Failed to update laser active state in backend:", error);
      }
    }
  };

  // Handle detector gain changes
  const updateDetectorGain = async (value) => {
    setDetectorGain(value);
    
    // Also update backend immediately if connected
    if (connectionSettingsState.ip && connectionSettingsState.apiPort) {
      try {
        await fetch(
          `${connectionSettingsState.ip}:${connectionSettingsState.apiPort}/SettingsController/setDetectorGain?gain=${value}`
        );
      } catch (error) {
        console.error("Failed to update detector gain in backend:", error);
      }
    }
  };

  // Helper: Min/Max stretch for PNG (Uint8)
  const minMaxStretch = async (imgUrl) => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let min = 255, max = 0;
        for (let i = 0; i < data.length; i += 4) {
          const v = data[i];
          if (v < min) min = v;
          if (v > max) max = v;
        }
        const range = max - min || 1;
        for (let i = 0; i < data.length; i += 4) {
          const stretched = Math.round(((data[i] - min) / range) * 255);
          data[i] = data[i + 1] = data[i + 2] = stretched;
        }
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = imgUrl;
    });
  };

  // Load image from backend and stretch
  const handleLoadImage = async () => {
    try {
      const response = await fetch(
        `${connectionSettingsState.ip}:${connectionSettingsState.apiPort}/RecordingController/snapNumpyToFastAPI?resizeFactor=1`
      );
      if (!response.ok) throw new Error("Failed to load image");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      // Get true pixel dimensions
      const img = new window.Image();
      img.onload = async () => {
        setImageDims({ width: img.naturalWidth, height: img.naturalHeight });
        const stretchedUrl = await minMaxStretch(url);
        setLoadedImage(stretchedUrl);
        // Reset crop region to full image
        dispatch(stormSlice.setCropRegion({
          x: 0,
          y: 0,
          width: img.naturalWidth,
          height: img.naturalHeight,
        }));
      };
      img.src = url;
    } catch (e) {
      alert("Could not load image: " + e.message);
    }
  };

  // Draw canvas with crop rectangle
  const drawCropCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const imgSrc = loadedImage;
    if (!canvas || !imgSrc) return;
    const ctx = canvas.getContext("2d");
    const img = new window.Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // Draw crop rectangle
      const scaleX = canvas.width / imageDims.width;
      const scaleY = canvas.height / imageDims.height;
      const crop = cropPreview || cropRegion;
      ctx.save();
      ctx.strokeStyle = "#ff0000";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY
      );
      ctx.restore();
    };
    img.src = imgSrc;
  }, [loadedImage, imageDims, cropRegion, cropPreview]);

  useEffect(() => {
    drawCropCanvas();
  }, [drawCropCanvas]);

  // Mouse events for cropping
  const handleCropMouseDown = (e) => {
    if (!loadedImage) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * imageDims.width) / canvas.width;
    const y = ((e.clientY - rect.top) * imageDims.height) / canvas.height;
    setIsCropping(true);
    setCropStart({ x, y });
    setCropPreview({ x, y, width: 1, height: 1 });
  };
  const handleCropMouseMove = (e) => {
    if (!isCropping) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * imageDims.width) / canvas.width;
    const y = ((e.clientY - rect.top) * imageDims.height) / canvas.height;
    const cropX = Math.max(0, Math.min(cropStart.x, x));
    const cropY = Math.max(0, Math.min(cropStart.y, y));
    const cropW = Math.abs(x - cropStart.x);
    const cropH = Math.abs(y - cropStart.y);
    setCropPreview({
      x: Math.round(cropX),
      y: Math.round(cropY),
      width: Math.round(cropW),
      height: Math.round(cropH),
    });
  };
  const handleCropMouseUp = () => {
    if (isCropping && cropPreview) {
      dispatch(stormSlice.setCropRegion(cropPreview));
    }
    setIsCropping(false);
    setCropPreview(null);
  };

  // Handle STORM reconstruction parameters
  const setStormParameter = async (paramName, value) => {
    const params = { [paramName]: value };
    
    try {
      await apiSTORMControllerSetParameters(params);
      dispatch(stormSlice.setStormParameters(params));
    } catch (error) {
      console.error("Error setting STORM parameter:", error);
    }
  };

  // Trigger STORM reconstruction
  const triggerReconstruction = async () => {
    try {
      await apiSTORMControllerTriggerReconstruction();
      dispatch(stormSlice.setIsReconstructing(true));
    } catch (error) {
      console.error("Error triggering STORM reconstruction:", error);
    }
  };

  // Reset crop region to full image
  const resetCropRegion = () => {
    if (loadedImage && imageDims.width && imageDims.height) {
      dispatch(stormSlice.setCropRegion({
        x: 0,
        y: 0,
        width: imageDims.width,
        height: imageDims.height,
      }));
    }
  };

  return (
    <Paper>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        {/* Left side - Always visible livestream */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Live Stream
            </Typography>
            
            {/* Live stream image */}
            <Box sx={{ flex: 1, minHeight: 400, border: '1px solid #ccc', mb: 2 }}>
              <LiveViewControlWrapper />
            </Box>

            {/* Status and frame counter */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box display="flex" alignItems="center">
                  <Typography variant="h6">Status: </Typography>
                  {isRunning ? (
                    <CheckCircleIcon
                      style={{ color: green[500], marginLeft: "10px" }}
                    />
                  ) : (
                    <CancelIcon style={{ color: red[500], marginLeft: "10px" }} />
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="h6">
                  Frame: {currentFrameNumber}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Right side - Control tabs */}
        <Grid item xs={12} md={6}>
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            aria-label="STORM controller tabs"
          >
            <Tab label="Experiment & Controls" />
            <Tab label="Crop Region" />
            <Tab label="Reconstructed Image" />
            <Tab label="STORM Reconstruction" />
          </Tabs>

          {/* Experiment & Controls Tab (merged exposure, gain, lasers) */}
          <TabPanel value={tabIndex} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Experiment Name"
                  value={experimentName}
                  onChange={(e) => dispatch(stormSlice.setExperimentName(e.target.value))}
                  fullWidth
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography gutterBottom>
                  Exposure Time: {exposureTime} ms
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Slider
                    value={exposureTime}
                    min={parameterRangeState.exposureTimeMin || 1}
                    max={parameterRangeState.exposureTimeMax || 1000}
                    onChange={(e, value) => {
                      // Clamp value and update
                      const min = parameterRangeState.exposureTimeMin || 1;
                      const max = parameterRangeState.exposureTimeMax || 1000;
                      let v = Math.max(min, Math.min(max, value));
                      setExposureTime(v);
                    }}
                    valueLabelDisplay="auto"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    type="number"
                    value={exposureTime}
                    onChange={e => {
                      const min = parameterRangeState.exposureTimeMin || 1;
                      const max = parameterRangeState.exposureTimeMax || 1000;
                      let v = parseInt(e.target.value) || min;
                      v = Math.max(min, Math.min(max, v));
                      setExposureTime(v);
                    }}
                    inputProps={{
                      min: parameterRangeState.exposureTimeMin || 1,
                      max: parameterRangeState.exposureTimeMax || 1000,
                      style: { width: 80 }
                    }}
                    size="small"
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography gutterBottom>
                  Detector Gain: {detectorGain}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Slider
                    value={detectorGain}
                    min={parameterRangeState.detectorGainMin || 0}
                    max={parameterRangeState.detectorGainMax || 100}
                    onChange={(e, value) => {
                      // Clamp value and update
                      const min = parameterRangeState.detectorGainMin || 0;
                      const max = parameterRangeState.detectorGainMax || 100;
                      let v = Math.max(min, Math.min(max, value));
                      updateDetectorGain(v);
                    }}
                    valueLabelDisplay="auto"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    type="number"
                    value={detectorGain}
                    onChange={e => {
                      const min = parameterRangeState.detectorGainMin || 0;
                      const max = parameterRangeState.detectorGainMax || 100;
                      let v = parseInt(e.target.value) || min;
                      v = Math.max(min, Math.min(max, v));
                      updateDetectorGain(v);
                    }}
                    inputProps={{
                      min: parameterRangeState.detectorGainMin || 0,
                      max: parameterRangeState.detectorGainMax || 100,
                      style: { width: 80 }
                    }}
                    size="small"
                  />
                </Box>
              </Grid>

              {/* Laser Controls */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Laser Control
                </Typography>
                {Object.entries(laserIntensities).map(([laserName, intensity]) => {
                  const isActive = laserActiveStates[laserName] || false;
                  const minValue = parameterRangeState.illuSourceMinIntensities?.[parameterRangeState.illuSources?.indexOf(laserName)] || 0;
                  const maxValue = parameterRangeState.illuSourceMaxIntensities?.[parameterRangeState.illuSources?.indexOf(laserName)] || 1023;
                  
                  return (
                    <Grid item xs={12} key={laserName} sx={{ mb: 2 }}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Typography sx={{ minWidth: 80 }}>
                              {laserName}
                            </Typography>
                            <Slider
                              value={intensity}
                              onChange={(e, value) => setLaserIntensity(laserName, value)}
                              min={minValue}
                              max={maxValue}
                              valueLabelDisplay="auto"
                              sx={{ flex: 1 }}
                            />
                            <Typography sx={{ mx: 1, minWidth: 50 }}>
                              {intensity}
                            </Typography>
                            <Checkbox
                              checked={isActive}
                              onChange={(e) => setLaserActive(laserName, e.target.checked)}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
                
                {Object.keys(laserIntensities).length === 0 && (
                  <Typography color="textSecondary">
                    No lasers configured. Laser controls will appear when connected to backend.
                  </Typography>
                )}
              </Grid>
              
              <Grid item xs={6}>
                <Button
                  variant="contained"
                  onClick={startExperiment}
                  disabled={isRunning}
                  color="primary"
                  fullWidth
                >
                  Start STORM
                </Button>
              </Grid>
              
              <Grid item xs={6}>
                <Button
                  variant="contained"
                  onClick={stopExperiment}
                  disabled={!isRunning}
                  color="secondary"
                  fullWidth
                >
                  Stop STORM
                </Button>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Crop Region Tab */}
          <TabPanel value={tabIndex} index={1}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">
                    Select Crop Region
                  </Typography>
                  <Box>
                    <Button
                      variant="outlined"
                      onClick={handleLoadImage}
                      size="small"
                      sx={{ mr: 1 }}
                    >
                      Load Image
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={resetCropRegion}
                      size="small"
                    >
                      Reset Crop
                    </Button>
                  </Box>
                </Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Load an image, then click and drag to select the crop region
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <canvas
                  ref={canvasRef}
                  width={imageDims.width || 400}
                  height={imageDims.height || 400}
                  style={{
                    border: '1px solid #ccc',
                    cursor: isCropping ? 'crosshair' : 'pointer',
                    maxWidth: '100%',
                  }}
                  onMouseDown={handleCropMouseDown}
                  onMouseMove={handleCropMouseMove}
                  onMouseUp={handleCropMouseUp}
                  onMouseLeave={handleCropMouseUp}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="X Position"
                  type="number"
                  value={cropRegion.x}
                  onChange={(e) => dispatch(stormSlice.setCropX(parseInt(e.target.value) || 0))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Y Position"
                  type="number"
                  value={cropRegion.y}
                  onChange={(e) => dispatch(stormSlice.setCropY(parseInt(e.target.value) || 0))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Width"
                  type="number"
                  value={cropRegion.width}
                  onChange={(e) => dispatch(stormSlice.setCropWidth(parseInt(e.target.value) || 1))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Height"
                  type="number"
                  value={cropRegion.height}
                  onChange={(e) => dispatch(stormSlice.setCropHeight(parseInt(e.target.value) || 1))}
                  fullWidth
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Reconstructed Image Tab */}
          <TabPanel value={tabIndex} index={2}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Reconstructed STORM Image
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  This tab will display the reconstructed STORM image when available.
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                {reconstructedImage ? (
                  <img
                    src={reconstructedImage}
                    alt="Reconstructed STORM"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: 400,
                      backgroundColor: '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px dashed #ccc',
                    }}
                  >
                    <Typography color="textSecondary">
                      No reconstructed image available
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </TabPanel>

          {/* STORM Reconstruction Tab */}
          <TabPanel value={tabIndex} index={3}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  STORM Reconstruction Parameters
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography gutterBottom>
                  Detection Threshold: {stormParameters.threshold}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Slider
                    value={stormParameters.threshold}
                    min={1}
                    max={1000}
                    onChange={(e, value) => setStormParameter('threshold', value)}
                    valueLabelDisplay="auto"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    type="number"
                    value={stormParameters.threshold}
                    onChange={e => setStormParameter('threshold', parseInt(e.target.value) || 1)}
                    inputProps={{
                      min: 1,
                      max: 1000,
                      style: { width: 80 }
                    }}
                    size="small"
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography gutterBottom>
                  ROI Size: {stormParameters.roi_size}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Slider
                    value={stormParameters.roi_size}
                    min={5}
                    max={50}
                    onChange={(e, value) => setStormParameter('roi_size', value)}
                    valueLabelDisplay="auto"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    type="number"
                    value={stormParameters.roi_size}
                    onChange={e => setStormParameter('roi_size', parseInt(e.target.value) || 5)}
                    inputProps={{
                      min: 5,
                      max: 50,
                      style: { width: 80 }
                    }}
                    size="small"
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography gutterBottom>
                  Update Rate: {stormParameters.update_rate}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Slider
                    value={stormParameters.update_rate}
                    min={1}
                    max={100}
                    onChange={(e, value) => setStormParameter('update_rate', value)}
                    valueLabelDisplay="auto"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    type="number"
                    value={stormParameters.update_rate}
                    onChange={e => setStormParameter('update_rate', parseInt(e.target.value) || 1)}
                    inputProps={{
                      min: 1,
                      max: 100,
                      style: { width: 80 }
                    }}
                    size="small"
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="h6">
                    Reconstruction Status:
                  </Typography>
                  {isReconstructing ? (
                    <CheckCircleIcon
                      style={{ color: green[500], marginLeft: "10px" }}
                    />
                  ) : (
                    <CancelIcon style={{ color: red[500], marginLeft: "10px" }} />
                  )}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={triggerReconstruction}
                  disabled={isReconstructing}
                  color="primary"
                  fullWidth
                >
                  {isReconstructing ? 'Reconstructing...' : 'Trigger STORM Reconstruction'}
                </Button>
              </Grid>
            </Grid>
          </TabPanel>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default STORMController;
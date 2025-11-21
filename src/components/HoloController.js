// src/components/HoloController.js
// Inline Hologram Processing Controller Component
// Provides live camera view, processed hologram stream, and parameter controls

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  Button,
  Card,
  CardContent,
  Slider,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Divider,
  Chip,
  Stack,
  Paper,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Pause as PauseIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  CenterFocusStrong as CenterFocusStrongIcon,
} from "@mui/icons-material";

// Redux slice
import * as holoSlice from "../state/slices/HoloSlice";
import * as connectionSettingsSlice from "../state/slices/ConnectionSettingsSlice";
import * as liveStreamSlice from "../state/slices/LiveStreamSlice";

// API imports
import apiInLineHoloControllerGetParams from "../backendapi/apiInLineHoloControllerGetParams";
import apiInLineHoloControllerSetParams from "../backendapi/apiInLineHoloControllerSetParams";
import apiInLineHoloControllerGetState from "../backendapi/apiInLineHoloControllerGetState";
import apiInLineHoloControllerStartProcessing from "../backendapi/apiInLineHoloControllerStartProcessing";
import apiInLineHoloControllerStopProcessing from "../backendapi/apiInLineHoloControllerStopProcessing";
import apiInLineHoloControllerPauseProcessing from "../backendapi/apiInLineHoloControllerPauseProcessing";
import apiInLineHoloControllerResumeProcessing from "../backendapi/apiInLineHoloControllerResumeProcessing";
import apiInLineHoloControllerSetRoi from "../backendapi/apiInLineHoloControllerSetRoi";
import apiInLineHoloControllerSetDz from "../backendapi/apiInLineHoloControllerSetDz";
import apiInLineHoloControllerSetBinning from "../backendapi/apiInLineHoloControllerSetBinning";
import apiInLineHoloControllerSetPixelsize from "../backendapi/apiInLineHoloControllerSetPixelsize";
import apiInLineHoloControllerSetWavelength from "../backendapi/apiInLineHoloControllerSetWavelength";

const HoloController = () => {
  const dispatch = useDispatch();
  const theme = useTheme();

  // Redux state
  const holoState = useSelector(holoSlice.getHoloState);
  const connectionSettings = useSelector(
    connectionSettingsSlice.getConnectionSettingsState
  );
  const liveStreamState = useSelector(liveStreamSlice.getLiveStreamState);

  // Local state for ROI selection
  const [roiSelection, setRoiSelection] = useState({
    isSelecting: false,
    centerX: 0,
    centerY: 0,
    size: 256,
  });

  // Refs for canvas interaction
  const rawCanvasRef = useRef(null);
  const processedCanvasRef = useRef(null);
  const rawImageRef = useRef(null);
  const processedImageRef = useRef(null);
  const actualFrameSizeRef = useRef([1920, 1080]); // Store actual camera frame size

  // Build stream URLs
  const baseUrl = `${connectionSettings.ip}:${connectionSettings.apiPort}`;
  const rawStreamUrl = `${baseUrl}/RecordingController/video_feeder`;
  const processedStreamUrl = `${baseUrl}/InLineHoloController/mjpeg_stream_inlineholo?startStream=true&jpeg_quality=85`;

  // Load initial parameters and state on mount
  useEffect(() => {
    loadParameters();
    loadState();
    
    // Set stream URLs
    dispatch(holoSlice.setRawStreamUrl(rawStreamUrl));
    dispatch(holoSlice.setProcessedStreamUrl(processedStreamUrl));
    
    // Poll state periodically
    const stateInterval = setInterval(loadState, 5000);
    
    return () => {
      clearInterval(stateInterval);
    };
  }, []);

  // Load parameters from backend
  const loadParameters = useCallback(async () => {
    try {
      const params = await apiInLineHoloControllerGetParams();
      
      // Update Redux state with backend parameters
      dispatch(holoSlice.setPixelsize(params.pixelsize || 3.45e-6));
      dispatch(holoSlice.setWavelength(params.wavelength || 488e-9));
      dispatch(holoSlice.setNa(params.na || 0.3));
      dispatch(holoSlice.setDz(params.dz || 0.0));
      dispatch(holoSlice.setBinning(params.binning || 1));
      dispatch(holoSlice.setRoiCenter(params.roi_center || [0, 0]));
      dispatch(holoSlice.setRoiSize(params.roi_size || 256));
      dispatch(holoSlice.setColorChannel(params.color_channel || "green"));
      dispatch(holoSlice.setFlipX(params.flip_x || false));
      dispatch(holoSlice.setFlipY(params.flip_y || false));
      dispatch(holoSlice.setRotation(params.rotation || 0));
      dispatch(holoSlice.setUpdateFreq(params.update_freq || 10.0));
      
      // Update local ROI selection state
      setRoiSelection({
        ...roiSelection,
        centerX: params.roi_center ? params.roi_center[0] : 0,
        centerY: params.roi_center ? params.roi_center[1] : 0,
        size: params.roi_size || 256,
      });
    } catch (error) {
      console.error("Failed to load hologram parameters:", error);
    }
  }, [dispatch]);

  // Load processing state from backend
  const loadState = useCallback(async () => {
    try {
      const state = await apiInLineHoloControllerGetState();
      
      dispatch(holoSlice.setIsProcessing(state.is_processing || false));
      dispatch(holoSlice.setIsPaused(state.is_paused || false));
      dispatch(holoSlice.setIsStreaming(state.is_streaming || false));
      dispatch(holoSlice.setLastProcessTime(state.last_process_time || 0.0));
      dispatch(holoSlice.setFrameCount(state.frame_count || 0));
      dispatch(holoSlice.setProcessedCount(state.processed_count || 0));
    } catch (error) {
      console.error("Failed to load hologram state:", error);
    }
  }, [dispatch]);

  // Start processing
  const handleStartProcessing = useCallback(async () => {
    try {
      await apiInLineHoloControllerStartProcessing();
      dispatch(holoSlice.setIsProcessing(true));
      dispatch(holoSlice.setIsPaused(false));
      await loadState();
    } catch (error) {
      console.error("Failed to start processing:", error);
    }
  }, [dispatch, loadState]);

  // Stop processing
  const handleStopProcessing = useCallback(async () => {
    try {
      await apiInLineHoloControllerStopProcessing();
      dispatch(holoSlice.setIsProcessing(false));
      dispatch(holoSlice.setIsPaused(false));
      await loadState();
    } catch (error) {
      console.error("Failed to stop processing:", error);
    }
  }, [dispatch, loadState]);

  // Pause processing - switch to binning 1
  const handlePauseProcessing = useCallback(async () => {
    try {
      // Store current binning before pause
      dispatch(holoSlice.setPreviousBinning(holoState.binning));
      
      // Set binning to 1 for pause mode
      await apiInLineHoloControllerSetBinning(1);
      dispatch(holoSlice.setBinning(1));
      
      // Pause processing
      await apiInLineHoloControllerPauseProcessing();
      dispatch(holoSlice.setIsPaused(true));
      await loadState();
    } catch (error) {
      console.error("Failed to pause processing:", error);
    }
  }, [dispatch, holoState.binning, loadState]);

  // Resume processing - restore previous binning
  const handleResumeProcessing = useCallback(async () => {
    try {
      // Restore previous binning
      const previousBinning = holoState.previousBinning || 1;
      await apiInLineHoloControllerSetBinning(previousBinning);
      dispatch(holoSlice.setBinning(previousBinning));
      
      // Resume processing
      await apiInLineHoloControllerResumeProcessing();
      dispatch(holoSlice.setIsPaused(false));
      await loadState();
    } catch (error) {
      console.error("Failed to resume processing:", error);
    }
  }, [dispatch, holoState.previousBinning, loadState]);

  // Update dz parameter
  const handleDzChange = useCallback(
    async (event, value) => {
      dispatch(holoSlice.setDz(value));
    },
    [dispatch]
  );

  const handleDzCommit = useCallback(
    async (event, value) => {
      try {
        await apiInLineHoloControllerSetDz(value);
      } catch (error) {
        console.error("Failed to update dz:", error);
      }
    },
    []
  );

  // Update ROI parameters
  const handleRoiCenterXChange = useCallback((event, value) => {
    setRoiSelection((prev) => ({ ...prev, centerX: value }));
  }, []);

  const handleRoiCenterYChange = useCallback((event, value) => {
    setRoiSelection((prev) => ({ ...prev, centerY: value }));
  }, []);

  const handleRoiSizeChange = useCallback((event, value) => {
    setRoiSelection((prev) => ({ ...prev, size: value }));
  }, []);

  // Apply ROI changes to backend
  const handleApplyRoi = useCallback(async () => {
    try {
      // Get subsampling factor from stream settings
      const subsamplingFactor = liveStreamState.streamSettings?.jpeg?.subsampling_factor || 1;
      
      // Get actual image dimensions from the loaded image
      const imgWidth = actualFrameSizeRef.current[0];
      const imgHeight = actualFrameSizeRef.current[1];
      
      // Convert relative coordinates (offset from center) to absolute pixel coordinates
      const imageCenterX = imgWidth / 2;
      const imageCenterY = imgHeight / 2;
      
      const absoluteX = imageCenterX + roiSelection.centerX;
      const absoluteY = imageCenterY + roiSelection.centerY;
      
      // Apply subsampling factor to absolute coordinates
      const scaledX = Math.round(absoluteX * subsamplingFactor);
      const scaledY = Math.round(absoluteY * subsamplingFactor);
      const scaledSize = Math.round(roiSelection.size * subsamplingFactor);
      
      console.log('ROI Parameters:', {
        relativeCenter: [roiSelection.centerX, roiSelection.centerY],
        frameSize: [imgWidth, imgHeight],
        absoluteCenter: [absoluteX, absoluteY],
        subsamplingFactor,
        scaledCenter: [scaledX, scaledY],
        scaledSize
      });
      
      const roiParams = {
        center_x: scaledX,
        center_y: scaledY,
        size: scaledSize,
      };
      
      await apiInLineHoloControllerSetRoi(roiParams);
      dispatch(holoSlice.setRoiCenter([roiSelection.centerX, roiSelection.centerY]));
      dispatch(holoSlice.setRoiSize(roiSelection.size));
    } catch (error) {
      console.error("Failed to apply ROI:", error);
    }
  }, [dispatch, roiSelection, liveStreamState.streamSettings]);

  // Reset ROI to center
  const handleResetRoi = useCallback(async () => {
    try {
      // Get subsampling factor from stream settings
      const subsamplingFactor = liveStreamState.streamSettings?.jpeg?.subsampling_factor || 1;
      
      // Get actual image dimensions
      const imgWidth = actualFrameSizeRef.current[0];
      const imgHeight = actualFrameSizeRef.current[1];
      
      // Center coordinates in absolute pixels (image center)
      const imageCenterX = imgWidth / 2;
      const imageCenterY = imgHeight / 2;
      
      // Apply subsampling factor
      const scaledCenterX = Math.round(imageCenterX * subsamplingFactor);
      const scaledCenterY = Math.round(imageCenterY * subsamplingFactor);
      const scaledSize = Math.round(256 * subsamplingFactor);
      
      const roiParams = {
        center_x: scaledCenterX,
        center_y: scaledCenterY,
        size: scaledSize,
      };
      
      await apiInLineHoloControllerSetRoi(roiParams);
      dispatch(holoSlice.setRoiCenter([0, 0]));
      dispatch(holoSlice.setRoiSize(256));
      setRoiSelection({
        ...roiSelection,
        centerX: 0,
        centerY: 0,
        size: 256,
      });
    } catch (error) {
      console.error("Failed to reset ROI:", error);
    }
  }, [dispatch, roiSelection, liveStreamState.streamSettings]);

  // Update developer parameters
  const handleUpdateParameter = useCallback(
    async (paramName, value) => {
      try {
        // Call individual API endpoint based on parameter
        switch (paramName) {
          case "pixelsize":
            await apiInLineHoloControllerSetPixelsize(value);
            dispatch(holoSlice.setPixelsize(value));
            break;
          case "wavelength":
            await apiInLineHoloControllerSetWavelength(value);
            dispatch(holoSlice.setWavelength(value));
            break;
          case "binning":
            await apiInLineHoloControllerSetBinning(value);
            dispatch(holoSlice.setBinning(value));
            break;
          case "na":
          case "color_channel":
          case "flip_x":
          case "flip_y":
          case "rotation":
          case "update_freq":
            // These use the bulk set_parameters endpoint
            await apiInLineHoloControllerSetParams({ [paramName]: value });
            // Update Redux state
            switch (paramName) {
              case "na":
                dispatch(holoSlice.setNa(value));
                break;
              case "color_channel":
                dispatch(holoSlice.setColorChannel(value));
                break;
              case "flip_x":
                dispatch(holoSlice.setFlipX(value));
                break;
              case "flip_y":
                dispatch(holoSlice.setFlipY(value));
                break;
              case "rotation":
                dispatch(holoSlice.setRotation(value));
                break;
              case "update_freq":
                dispatch(holoSlice.setUpdateFreq(value));
                break;
              default:
                break;
            }
            break;
          default:
            console.warn(`Unknown parameter: ${paramName}`);
            break;
        }
      } catch (error) {
        console.error(`Failed to update ${paramName}:`, error);
      }
    },
    [dispatch]
  );

  // Draw ROI overlay on canvas
  const drawRoiOverlay = useCallback((canvas, image, centerX, centerY, size) => {
    if (!canvas || !image) return;
    
    const ctx = canvas.getContext("2d");
    const imgWidth = image.naturalWidth || image.width;
    const imgHeight = image.naturalHeight || image.height;
    
    // Clear the entire canvas first
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate canvas display size
    const canvasDisplayWidth = canvas.clientWidth;
    const canvasDisplayHeight = canvas.clientHeight;
    
    // Use uniform scaling (same for X and Y) to maintain square ROI
    const scale = Math.min(canvasDisplayWidth / imgWidth, canvasDisplayHeight / imgHeight);
    
    // Calculate actual displayed image size
    const displayedWidth = imgWidth * scale;
    const displayedHeight = imgHeight * scale;
    
    // Calculate offset if image is centered in canvas
    const offsetX = (canvasDisplayWidth - displayedWidth) / 2;
    const offsetY = (canvasDisplayHeight - displayedHeight) / 2;
    
    // Convert ROI center from image coordinates to canvas coordinates
    // Center is relative to image center (0,0 = image center)
    const imageCenterX = imgWidth / 2;
    const imageCenterY = imgHeight / 2;
    
    const roiAbsX = imageCenterX + centerX;
    const roiAbsY = imageCenterY + centerY;
    
    const canvasX = offsetX + roiAbsX * scale;
    const canvasY = offsetY + roiAbsY * scale;
    const canvasSize = size * scale;
    
    // Draw red rectangle overlay (square)
    ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      canvasX - canvasSize / 2,
      canvasY - canvasSize / 2,
      canvasSize,
      canvasSize
    );
    
    // Draw crosshair at center
    ctx.beginPath();
    ctx.moveTo(canvasX - 10, canvasY);
    ctx.lineTo(canvasX + 10, canvasY);
    ctx.moveTo(canvasX, canvasY - 10);
    ctx.lineTo(canvasX, canvasY + 10);
    ctx.stroke();
  }, []);

  // Handle canvas click for ROI selection
  const handleCanvasClick = useCallback((event, canvasRef, imageRef) => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const image = imageRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Get click position relative to canvas
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Get image dimensions
    const imgWidth = image.naturalWidth || image.width;
    const imgHeight = image.naturalHeight || image.height;
    
    // Store actual frame size
    actualFrameSizeRef.current = [imgWidth, imgHeight];
    
    // Use uniform scaling to match drawRoiOverlay
    const canvasDisplayWidth = canvas.clientWidth;
    const canvasDisplayHeight = canvas.clientHeight;
    const scale = Math.min(canvasDisplayWidth / imgWidth, canvasDisplayHeight / imgHeight);
    
    // Calculate actual displayed image size and offset
    const displayedWidth = imgWidth * scale;
    const displayedHeight = imgHeight * scale;
    const offsetX = (canvasDisplayWidth - displayedWidth) / 2;
    const offsetY = (canvasDisplayHeight - displayedHeight) / 2;
    
    // Convert click position to image coordinates
    const imageX = (clickX - offsetX) / scale;
    const imageY = (clickY - offsetY) / scale;
    
    // Convert to relative coordinates (center = 0,0)
    const imageCenterX = imgWidth / 2;
    const imageCenterY = imgHeight / 2;
    
    const relativeX = imageX - imageCenterX;
    const relativeY = imageY - imageCenterY;
    
    console.log('Click:', {
      canvasClick: [clickX, clickY],
      imageSize: [imgWidth, imgHeight],
      imageCoords: [imageX, imageY],
      relativeCoords: [relativeX, relativeY]
    });
    
    // Update ROI selection
    setRoiSelection((prev) => ({
      ...prev,
      centerX: Math.round(relativeX),
      centerY: Math.round(relativeY),
    }));
  }, []);

  // Update canvas overlay when ROI changes
  useEffect(() => {
    if (rawCanvasRef.current && rawImageRef.current) {
      drawRoiOverlay(
        rawCanvasRef.current,
        rawImageRef.current,
        roiSelection.centerX,
        roiSelection.centerY,
        roiSelection.size
      );
    }
  }, [roiSelection, drawRoiOverlay]);

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: "100%" }}>
      <Typography variant="h5" gutterBottom>
        Inline Hologram Processing
      </Typography>

      {/* Control Buttons */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={handleStartProcessing}
            disabled={holoState.isProcessing && !holoState.isPaused}
            sx={{ minWidth: { xs: "100%", sm: "auto" } }}
          >
            Start
          </Button>
          
          {holoState.isPaused ? (
            <Button
              variant="contained"
              color="success"
              startIcon={<PlayArrowIcon />}
              onClick={handleResumeProcessing}
              disabled={!holoState.isProcessing}
              sx={{ minWidth: { xs: "100%", sm: "auto" } }}
            >
              Resume
            </Button>
          ) : (
            <Button
              variant="contained"
              color="warning"
              startIcon={<PauseIcon />}
              onClick={handlePauseProcessing}
              disabled={!holoState.isProcessing || holoState.isPaused}
              sx={{ minWidth: { xs: "100%", sm: "auto" } }}
            >
              Pause
            </Button>
          )}
          
          <Button
            variant="contained"
            color="error"
            startIcon={<StopIcon />}
            onClick={handleStopProcessing}
            disabled={!holoState.isProcessing}
            sx={{ minWidth: { xs: "100%", sm: "auto" } }}
          >
            Stop
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadParameters}
            sx={{ minWidth: { xs: "100%", sm: "auto" } }}
          >
            Refresh
          </Button>
        </Stack>

        {/* Status Chips */}
        <Stack direction="row" spacing={1} mt={2} flexWrap="wrap" useFlexGap>
          <Chip
            label={holoState.isProcessing ? "Processing" : "Stopped"}
            color={holoState.isProcessing ? "success" : "default"}
            size="small"
          />
          {holoState.isPaused && (
            <Chip label="Paused" color="warning" size="small" />
          )}
          <Chip
            label={`Frames: ${holoState.frameCount}`}
            variant="outlined"
            size="small"
          />
          <Chip
            label={`Processed: ${holoState.processedCount}`}
            variant="outlined"
            size="small"
          />
        </Stack>
      </Paper>

      {/* Video Streams */}
      <Grid container spacing={2} mb={2}>
        {/* Raw Camera Stream */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Camera Stream
              </Typography>
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  paddingTop: "75%", // 4:3 aspect ratio
                  backgroundColor: "#000",
                  borderRadius: 1,
                  overflow: "hidden",
                  cursor: "crosshair",
                }}
                onClick={(e) => handleCanvasClick(e, rawCanvasRef, rawImageRef)}
              >
                <img
                  ref={rawImageRef}
                  src={rawStreamUrl}
                  alt="Raw Camera Stream"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                  onLoad={() => {
                    if (rawCanvasRef.current && rawImageRef.current) {
                      const canvas = rawCanvasRef.current;
                      const img = rawImageRef.current;
                      canvas.width = img.naturalWidth;
                      canvas.height = img.naturalHeight;
                      
                      // Store actual frame size
                      actualFrameSizeRef.current = [img.naturalWidth, img.naturalHeight];
                      
                      drawRoiOverlay(
                        canvas,
                        img,
                        roiSelection.centerX,
                        roiSelection.centerY,
                        roiSelection.size
                      );
                    }
                  }}
                />
                <canvas
                  ref={rawCanvasRef}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" mt={1}>
                Click to set ROI center
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Processed Hologram Stream */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Processed Hologram
              </Typography>
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  paddingTop: "75%", // 4:3 aspect ratio
                  backgroundColor: "#000",
                  borderRadius: 1,
                  overflow: "hidden",
                }}
              >
                <img
                  ref={processedImageRef}
                  src={processedStreamUrl}
                  alt="Processed Hologram Stream"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Parameter Control - dz Slider */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Propagation Distance (dz)
        </Typography>
        <Box sx={{ px: 2 }}>
          <Slider
            value={holoState.dz}
            onChange={handleDzChange}
            onChangeCommitted={handleDzCommit}
            min={0}
            max={5000e-6}
            step={1e-6}
            valueLabelDisplay="on"
            valueLabelFormat={(value) => `${(value * 1e6).toFixed(1)} µm`}
            marks={[
              { value: 0, label: "0 µm" },
              { value: 5000e-6, label: "5000 µm" },
            ]}
            sx={{
              "& .MuiSlider-thumb": {
                width: 24,
                height: 24,
              },
            }}
          />
        </Box>
      </Paper>

      {/* ROI Controls */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">ROI Selection</Typography>
          <Tooltip title="Reset ROI to center">
            <IconButton onClick={handleResetRoi} size="small">
              <CenterFocusStrongIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container spacing={2}>
          {/* Center X */}
          <Grid item xs={12} sm={4}>
            <Typography gutterBottom>Center X</Typography>
            <Slider
              value={roiSelection.centerX}
              onChange={handleRoiCenterXChange}
              min={-960}
              max={960}
              step={1}
              valueLabelDisplay="auto"
              marks={[
                { value: -960, label: "-960" },
                { value: 0, label: "0" },
                { value: 960, label: "960" },
              ]}
              sx={{
                "& .MuiSlider-thumb": {
                  width: 20,
                  height: 20,
                },
              }}
            />
          </Grid>

          {/* Center Y */}
          <Grid item xs={12} sm={4}>
            <Typography gutterBottom>Center Y</Typography>
            <Slider
              value={roiSelection.centerY}
              onChange={handleRoiCenterYChange}
              min={-540}
              max={540}
              step={1}
              valueLabelDisplay="auto"
              marks={[
                { value: -540, label: "-540" },
                { value: 0, label: "0" },
                { value: 540, label: "540" },
              ]}
              sx={{
                "& .MuiSlider-thumb": {
                  width: 20,
                  height: 20,
                },
              }}
            />
          </Grid>

          {/* Size */}
          <Grid item xs={12} sm={4}>
            <Typography gutterBottom>Size</Typography>
            <Slider
              value={roiSelection.size}
              onChange={handleRoiSizeChange}
              min={64}
              max={1024}
              step={64}
              valueLabelDisplay="auto"
              marks={[
                { value: 64, label: "64" },
                { value: 256, label: "256" },
                { value: 512, label: "512" },
                { value: 1024, label: "1024" },
              ]}
              sx={{
                "& .MuiSlider-thumb": {
                  width: 20,
                  height: 20,
                },
              }}
            />
          </Grid>
        </Grid>

        <Button
          variant="contained"
          color="primary"
          onClick={handleApplyRoi}
          fullWidth
          sx={{ mt: 2 }}
        >
          Apply ROI
        </Button>
      </Paper>

      {/* Developer Options */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <SettingsIcon sx={{ mr: 1 }} />
          <Typography>Developer Options</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {/* Pixel Size */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Pixel Size (µm)"
                type="number"
                value={(holoState.pixelsize * 1e6).toFixed(3)}
                onChange={(e) =>
                  handleUpdateParameter("pixelsize", parseFloat(e.target.value) * 1e-6)
                }
                fullWidth
                inputProps={{ step: 0.001 }}
              />
            </Grid>

            {/* Wavelength */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Wavelength (nm)"
                type="number"
                value={(holoState.wavelength * 1e9).toFixed(1)}
                onChange={(e) =>
                  handleUpdateParameter("wavelength", parseFloat(e.target.value) * 1e-9)
                }
                fullWidth
                inputProps={{ step: 1 }}
              />
            </Grid>

            {/* Numerical Aperture */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Numerical Aperture (NA)"
                type="number"
                value={holoState.na}
                onChange={(e) =>
                  handleUpdateParameter("na", parseFloat(e.target.value))
                }
                fullWidth
                inputProps={{ step: 0.01, min: 0, max: 1 }}
              />
            </Grid>

            {/* Binning */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Binning</InputLabel>
                <Select
                  value={holoState.binning}
                  label="Binning"
                  onChange={(e) => handleUpdateParameter("binning", e.target.value)}
                >
                  <MenuItem value={1}>1x1</MenuItem>
                  <MenuItem value={2}>2x2</MenuItem>
                  <MenuItem value={4}>4x4</MenuItem>
                  <MenuItem value={8}>8x8</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Color Channel */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Color Channel</InputLabel>
                <Select
                  value={holoState.colorChannel}
                  label="Color Channel"
                  onChange={(e) => handleUpdateParameter("color_channel", e.target.value)}
                >
                  <MenuItem value="red">Red</MenuItem>
                  <MenuItem value="green">Green</MenuItem>
                  <MenuItem value="blue">Blue</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Update Frequency */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Update Frequency (Hz)"
                type="number"
                value={holoState.updateFreq}
                onChange={(e) =>
                  handleUpdateParameter("update_freq", parseFloat(e.target.value))
                }
                fullWidth
                inputProps={{ step: 1, min: 1, max: 60 }}
              />
            </Grid>

            {/* Flip X */}
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={holoState.flipX}
                    onChange={(e) => handleUpdateParameter("flip_x", e.target.checked)}
                  />
                }
                label="Flip X"
              />
            </Grid>

            {/* Flip Y */}
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={holoState.flipY}
                    onChange={(e) => handleUpdateParameter("flip_y", e.target.checked)}
                  />
                }
                label="Flip Y"
              />
            </Grid>

            {/* Rotation */}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Rotation</InputLabel>
                <Select
                  value={holoState.rotation}
                  label="Rotation"
                  onChange={(e) => handleUpdateParameter("rotation", e.target.value)}
                >
                  <MenuItem value={0}>0°</MenuItem>
                  <MenuItem value={90}>90°</MenuItem>
                  <MenuItem value={180}>180°</MenuItem>
                  <MenuItem value={270}>270°</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default HoloController;

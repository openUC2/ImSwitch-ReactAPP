import React, { useState, useEffect, useCallback, useRef } from "react";

import { Box, IconButton, TextField, Typography, Button } from "@mui/material";
import {
  PlayArrow,
  Stop,
  CameraAlt,
  FiberManualRecord,
  Stop as StopIcon,
} from "@mui/icons-material";
import StreamControlOverlay from "../components/StreamControlOverlay";
import apiViewControllerGetLiveViewActive from "../backendapi/apiViewControllerGetLiveViewActive";
import apiPositionerControllerMovePositioner from "../backendapi/apiPositionerControllerMovePositioner";
import { useSelector, useDispatch } from "react-redux";
import * as liveStreamSlice from "../state/slices/LiveStreamSlice.js";
import * as liveViewSlice from "../state/slices/LiveViewSlice.js";

export default function StreamControls({
  isStreamRunning, // This prop is kept for backwards compatibility but we prefer Redux state
  onToggleStream,
  onSnap,
  isRecording,
  onStartRecord,
  onStopRecord,
  snapFileName,
  setSnapFileName,
  onGoToImage,
  lastSnapPath,
}) {

  const dispatch = useDispatch();
  
  // Get stream stats from Redux (includes fps which indicates active frames)
  const liveStreamState = useSelector(liveStreamSlice.getLiveStreamState);
  const liveViewState = useSelector(liveViewSlice.getLiveViewState);
  
  // Use Redux state as source of truth for stream status
  const isLiveViewActive = liveViewState.isStreamRunning;

  // State for HUD data for overlay display
  const [hudData, setHudData] = useState({
    stats: { fps: 0, bps: 0 },
    featureSupport: { webgl2: false, lz4: false },
    isWebGL: false,
    imageSize: { width: 0, height: 0 },
    viewTransform: { scale: 1, translateX: 0, translateY: 0 }
  });

  // Sync hudData stats with Redux stats for overlay display
  useEffect(() => {
    setHudData(prevData => ({
      ...prevData,
      stats: {
        fps: liveStreamState.stats.fps || 0,
        bps: liveStreamState.stats.bps || 0
      }
    }));
  }, [liveStreamState.stats.fps, liveStreamState.stats.bps]);

  // Periodic status check to keep Redux in sync with backend
  // This catches cases where backend state changes without frontend knowledge
  const checkLiveViewStatus = useCallback(async () => {
    try {
      const active = await apiViewControllerGetLiveViewActive();
      
      // Only update Redux if state differs from backend
      if (active !== liveViewState.isStreamRunning) {
        console.log(`[StreamControls] Backend status mismatch detected. Backend: ${active}, Frontend: ${liveViewState.isStreamRunning}`);
        dispatch(liveViewSlice.setIsStreamRunning(active));
      }
    } catch (error) {
      console.warn('[StreamControls] Failed to check live view status:', error);
    }
  }, [liveViewState.isStreamRunning, dispatch]);

  // Periodic sync every 5 seconds to catch any state drift
  useEffect(() => {
    const interval = setInterval(checkLiveViewStatus, 5000);
    return () => clearInterval(interval);
  }, [checkLiveViewStatus]);

 
  // Move Z-axis handler
  const moveZAxis = useCallback((distance) => {
    apiPositionerControllerMovePositioner({
      axis: "Z",
      dist: distance,
      isAbsolute: false,
    })
      .then((response) => {
        console.log(`Moved Z-axis by ${distance}:`, response);
      })
      .catch((error) => {
        console.error(`Error moving Z-axis by ${distance}:`, error);
      });
  }, []);

  // Keyboard event handler for Z-axis control
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle if not typing in an input field
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.key) {
        case '+':
        case '=': // Also handle = key (same physical key as + without shift)
          event.preventDefault();
          moveZAxis(10); // Move up 10 steps
          break;
        case '-':
        case '_': // Also handle _ key (same physical key as - with shift)
          event.preventDefault();
          moveZAxis(-10); // Move down 10 steps
          break;
        case '.':
        case '>': // Also handle > key (same physical key as . with shift)
          event.preventDefault();
          moveZAxis(100); // Move up 100 steps
          break;
        case ',':
        case '<': // Also handle < key (same physical key as , with shift)
          event.preventDefault();
          moveZAxis(-100); // Move down 100 steps
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [moveZAxis]);


  // Handle start stream
  const handleStartStream = useCallback(async () => {
    if (!isLiveViewActive) {
      await onToggleStream();
      // Status will be updated by the toggleStream function in LiveView.js
    }
  }, [isLiveViewActive, onToggleStream]);

  // Handle stop stream
  const handleStopStream = useCallback(async () => {
    if (isLiveViewActive) {
      await onToggleStream();
      // Status will be updated by the toggleStream function in LiveView.js
    }
  }, [isLiveViewActive, onToggleStream]);

  // Render stream controls with editable image name and icon buttons
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center", position: "relative" }}>
      {/* Stream control buttons */}
      <Typography variant="h6">Stream</Typography>
      
      {/* Start button - green when stream is OFF (can start), gray when ON */}
      <IconButton
        onClick={handleStartStream}
        sx={{
          color: !isLiveViewActive ? 'success.main' : 'action.disabled',
          '&:hover': {
            backgroundColor: !isLiveViewActive ? 'success.light' : 'transparent',
            opacity: !isLiveViewActive ? 0.8 : 0.5
          }
        }}
      >
        <PlayArrow />
      </IconButton>

      {/* Stop button - red when stream is ON (can stop), gray when OFF */}
      <IconButton
        onClick={handleStopStream}
        sx={{
          color: isLiveViewActive ? 'error.main' : 'action.disabled',
          '&:hover': {
            backgroundColor: isLiveViewActive ? 'error.light' : 'transparent',
            opacity: isLiveViewActive ? 0.8 : 0.5
          }
        }}
      >
        <Stop />
      </IconButton>

      {/* Editable image name field */}
      <TextField
        label="Image Name"
        size="small"
        value={snapFileName}
        onChange={(e) => setSnapFileName(e.target.value)}
        sx={{ width: 180 }}
      />
      {/* Snap icon button */}
      <IconButton color="primary" onClick={onSnap}>
        <CameraAlt />
      </IconButton>
      <Button variant="outlined" disabled={!lastSnapPath} onClick={onGoToImage}>
        Go to image
      </Button>
      {/* Record icon buttons */}
      {!isRecording ? (
        <IconButton
          color="secondary"
          onClick={onStartRecord}
          sx={{
            animation: isRecording ? "blinker 1s linear infinite" : "none",
            "@keyframes blinker": {
              "50%": { opacity: 0 },
            },
          }}
        >
          <FiberManualRecord />
        </IconButton>
      ) : (
        <IconButton color="error" onClick={onStopRecord}>
          <StopIcon />
        </IconButton>
      )}

      {/* Stream Control Overlay - positioned absolutely to not affect layout */}
      <Box sx={{ position: "absolute", top: -10, right: -100, zIndex: 1001 }}> {/* FIXME: Adjust position as needed */}
        <StreamControlOverlay
          stats={hudData.stats}
          featureSupport={hudData.featureSupport}
          isWebGL={hudData.isWebGL}
          imageSize={hudData.imageSize}
          viewTransform={hudData.viewTransform}
        />
      </Box>
    </Box>
  );
}

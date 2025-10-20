import React, { useState, useEffect, useCallback } from "react";

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

export default function StreamControls({
  isStreamRunning,
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

  // State for HUD data from LiveViewerGL
  const [hudData, setHudData] = useState({
    stats: { fps: 0, bps: 0 },
    featureSupport: { webgl2: false, lz4: false },
    isWebGL: false,
    imageSize: { width: 0, height: 0 },
    viewTransform: { scale: 1, translateX: 0, translateY: 0 }
  });

  // State for stream status from backend
  const [isLiveViewActive, setIsLiveViewActive] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Poll backend for live view status
  const checkLiveViewStatus = useCallback(async () => {
    try {
      setIsCheckingStatus(true);
      const active = await apiViewControllerGetLiveViewActive();
      setIsLiveViewActive(active);
    } catch (error) {
      console.warn('Failed to check live view status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  }, []);

  // Check status on mount and set up polling
  useEffect(() => {
    // Check immediately on mount
    checkLiveViewStatus();
    
    // Poll every 2 seconds
    const interval = setInterval(checkLiveViewStatus, 2000);
    
    return () => clearInterval(interval);
  }, [checkLiveViewStatus]);

  // Also check status after toggle
  const handleToggleStream = useCallback(async () => {
    await onToggleStream();
    // Wait a bit for backend to update, then check status
    setTimeout(checkLiveViewStatus, 500);
  }, [onToggleStream, checkLiveViewStatus]);

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


  // Render stream controls with editable image name and icon buttons
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center", position: "relative" }}>
      {/* Stream toggle icon button */}
      <Typography variant="h6">Stream</Typography>
      <IconButton
        color={isLiveViewActive ? "secondary" : "primary"}
        onClick={handleToggleStream}
        disabled={isCheckingStatus}
      >
        {isLiveViewActive ? <Stop /> : <PlayArrow />}
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

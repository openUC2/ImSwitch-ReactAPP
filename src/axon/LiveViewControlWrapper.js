import React, { useState, useCallback } from "react";
import { IconButton, Tooltip } from "@mui/material";
import { Gamepad, GamepadOutlined } from "@mui/icons-material";
import LiveViewComponent from "./LiveViewComponent";
import LiveViewerGL from "../components/LiveViewerGL";
import WebRTCViewer from "./WebRTCViewer";
import PositionControllerComponent from "./PositionControllerComponent";
import apiPositionerControllerMovePositioner from "../backendapi/apiPositionerControllerMovePositioner";
import { useSelector, useDispatch } from "react-redux";
import * as objectiveSlice from "../state/slices/ObjectiveSlice.js";
import * as liveStreamSlice from "../state/slices/LiveStreamSlice.js";
import * as liveViewSlice from "../state/slices/LiveViewSlice.js";

/**
 * LiveViewControlWrapper - Unified wrapper for different stream viewers
 * Automatically selects the appropriate viewer based on stream format (WebRTC, Binary/WebGL, JPEG)
 * 
 * @param {boolean} useFastMode - Use optimized processing for better performance
 * @param {function} onClick - Callback for single click: (pixelX, pixelY, imageWidth, imageHeight, displayInfo)
 * @param {function} onImageLoad - Callback when image dimensions change: (width, height)
 * @param {React.ReactNode} overlayContent - Optional overlay content to render on top of the viewer
 * @param {boolean} enableStageMovement - Enable default double-click stage movement behavior (default: true)
 */
const LiveViewControlWrapper = ({ 
  useFastMode = true, 
  onClick, 
  onImageLoad, 
  overlayContent,
  enableStageMovement = true 
}) => {
  const dispatch = useDispatch();
  const objectiveState = useSelector(objectiveSlice.getObjectiveState);
  const liveStreamState = useSelector(liveStreamSlice.getLiveStreamState);
  const liveViewState = useSelector(liveViewSlice.getLiveViewState);

  // Get persistent position controller visibility from Redux
  const showPositionController = liveViewState.showPositionController || false;
  const [isHovering, setIsHovering] = useState(false);

  // State for HUD data from LiveViewerGL
  const [hudData, setHudData] = useState({
    stats: { fps: 0, bps: 0 },
    featureSupport: { webgl2: false, lz4: false },
    isWebGL: false,
    imageSize: { width: 0, height: 0 },
    viewTransform: { scale: 1, translateX: 0, translateY: 0 },
  });

  // Determine which viewer to use based on stream format
  // - WebRTC: Use WebRTCViewer for real-time low-latency streaming
  // - Binary: Use LiveViewerGL for high-performance WebGL rendering
  // - JPEG: Use LiveViewComponent (legacy) for JPEG streaming
  const useWebRTC = liveStreamState.imageFormat === "webrtc";
  const useWebGL =
    !useWebRTC &&
    liveStreamState.backendCapabilities.webglSupported &&
    !liveStreamState.isLegacyBackend &&
    liveStreamState.imageFormat !== "jpeg";

  // Handle double-click for stage movement
  const handleImageDoubleClick = async (
    pixelX,
    pixelY,
    imageWidth,
    imageHeight
  ) => {
    if (!enableStageMovement) return;
    
    try {
      // Calculate real-world position from pixel coordinates
      // Use the actual image dimensions and center coordinates properly
      const fovX = objectiveState.fovX || 1000; // fallback FOV in microns
      const fovY = objectiveState.fovY || (fovX * imageHeight) / imageWidth; // calculate FOV Y based on aspect ratio

      // Calculate the center of the image
      const centerX = imageWidth / 2;
      const centerY = imageHeight / 2;

      // Calculate relative movement from image center
      const relativeX = (pixelX - centerX) / imageWidth; // -0.5 to 0.5
      const relativeY = (pixelY - centerY) / imageHeight; // -0.5 to 0.5

      // Convert to microns
      const moveX = relativeX * fovX;
      const moveY = relativeY * fovY;

      console.log(
        `Image: ${imageWidth}x${imageHeight}, Click: (${pixelX}, ${pixelY}), Center: (${centerX}, ${centerY})`
      );
      console.log(
        `Relative: (${relativeX.toFixed(3)}, ${relativeY.toFixed(
          3
        )}), Moving stage by: X=${moveX.toFixed(2)}µm, Y=${moveY.toFixed(2)}µm`
      );

      // Move stage to the clicked position (relative movement)
      await apiPositionerControllerMovePositioner({
        axis: "X",
        dist: moveX,
        isAbsolute: false,
        isBlocking: false,
      });

      await apiPositionerControllerMovePositioner({
        axis: "Y",
        dist: -moveY, // Invert Y as microscope Y often goes opposite to image Y
        isAbsolute: false,
        isBlocking: false,
      });
    } catch (error) {
      console.error("Failed to move stage:", error);
    }
  };

  // Handle HUD data updates from LiveViewerGL
  const handleHudDataUpdate = useCallback((data) => {
    setHudData((prevData) => {
      // Only update if data has actually changed to prevent unnecessary re-renders
      if (!prevData) return data;

      const hasChanged =
        prevData.stats?.fps !== data.stats?.fps ||
        prevData.stats?.bps !== data.stats?.bps ||
        prevData.imageSize?.width !== data.imageSize?.width ||
        prevData.imageSize?.height !== data.imageSize?.height ||
        prevData.viewTransform?.scale !== data.viewTransform?.scale ||
        prevData.viewTransform?.translateX !== data.viewTransform?.translateX ||
        prevData.viewTransform?.translateY !== data.viewTransform?.translateY ||
        prevData.isWebGL !== data.isWebGL ||
        JSON.stringify(prevData.featureSupport) !==
          JSON.stringify(data.featureSupport);

      return hasChanged ? data : prevData;
    });
  }, []);

  // Handle image load - forward to parent if callback provided
  const handleImageLoadInternal = useCallback((width, height) => {
    if (onImageLoad) {
      onImageLoad(width, height);
    }
  }, [onImageLoad]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Toggle button for position controller (always visible) */}
      <Tooltip
        title={showPositionController ? "Hide controls" : "Show controls"}
      >
        <IconButton
          onClick={() =>
            dispatch(
              liveViewSlice.setShowPositionController(!showPositionController)
            )
          }
          sx={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 3,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            color: "white",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.7)",
            },
          }}
        >
          {showPositionController ? <Gamepad /> : <GamepadOutlined />}
        </IconButton>
      </Tooltip>

      <div
        style={{
          position: "relative",
          flex: "1",
          width: "100%",
          maxHeight: "calc(100vh - 220px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Select appropriate viewer based on stream format */}
        {/* WebRTC: Only render when stream is running to force remount on start/stop */}
        {useWebRTC && liveViewState.isStreamRunning ? (
          <WebRTCViewer
            key="webrtc-viewer" // Force new instance on remount
            onClick={onClick}
            onDoubleClick={handleImageDoubleClick}
            onImageLoad={handleImageLoadInternal}
            onHudDataUpdate={handleHudDataUpdate}
          />
        ) : useWebGL ? (
          <LiveViewerGL
            onClick={onClick}
            onDoubleClick={handleImageDoubleClick}
            onImageLoad={handleImageLoadInternal}
            onHudDataUpdate={handleHudDataUpdate}
            overlayContent={overlayContent}
          />
        ) : (
          <LiveViewComponent
            useFastMode={useFastMode}
            onClick={onClick}
            onDoubleClick={handleImageDoubleClick}
            onImageLoad={handleImageLoadInternal}
            overlayContent={overlayContent}
          />
        )}
      </div>

      {/* Position controller - shown on hover OR when toggled on */}
      {(showPositionController ||
        (isHovering && window.matchMedia("(hover: hover)").matches)) && (
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            left: "0px",
            zIndex: 2,
            opacity: isHovering ? 0.9 : 0.7,
            transition: "opacity 0.3s ease-in-out",
          }}
        >
          <PositionControllerComponent />
        </div>
      )}
    </div>
  );
};

export default LiveViewControlWrapper;

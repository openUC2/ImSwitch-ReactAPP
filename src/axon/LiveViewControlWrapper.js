
import React, { useState, useCallback } from "react";
import LiveViewComponent from "./LiveViewComponent";
import LiveViewerGL from "../components/LiveViewerGL";
import PositionControllerComponent from "./PositionControllerComponent";
import apiPositionerControllerMovePositioner from "../backendapi/apiPositionerControllerMovePositioner";
import { useSelector } from "react-redux";
import * as objectiveSlice from "../state/slices/ObjectiveSlice.js";
import * as liveStreamSlice from "../state/slices/LiveStreamSlice.js";

const LiveViewControlWrapper = ({ useFastMode = true }) => {
  const objectiveState = useSelector(objectiveSlice.getObjectiveState);
  const liveStreamState = useSelector(liveStreamSlice.getLiveStreamState);
  
  // State for HUD data from LiveViewerGL
  const [hudData, setHudData] = useState({
    stats: { fps: 0, bps: 0 },
    featureSupport: { webgl2: false, lz4: false },
    isWebGL: false,
    imageSize: { width: 0, height: 0 },
    viewTransform: { scale: 1, translateX: 0, translateY: 0 }
  });
  
  // Determine if we should use WebGL based on backend capabilities AND current format
  // Use LiveViewComponent (legacy) for JPEG, LiveViewerGL for binary
  const useWebGL = liveStreamState.backendCapabilities.webglSupported && 
                   !liveStreamState.isLegacyBackend &&
                   liveStreamState.imageFormat !== 'jpeg';

  // Handle double-click for stage movement
  const handleImageDoubleClick = async (pixelX, pixelY, imageWidth, imageHeight) => {
    try {
      // Calculate real-world position from pixel coordinates
      // Use the actual image dimensions and center coordinates properly
      const fovX = objectiveState.fovX || 1000; // fallback FOV in microns
      const fovY = objectiveState.fovY || (fovX * imageHeight / imageWidth); // calculate FOV Y based on aspect ratio
      
      // Calculate the center of the image
      const centerX = imageWidth / 2;
      const centerY = imageHeight / 2;
      
      // Calculate relative movement from image center
      const relativeX = (pixelX - centerX) / imageWidth;  // -0.5 to 0.5
      const relativeY = (pixelY - centerY) / imageHeight; // -0.5 to 0.5
      
      // Convert to microns
      const moveX = relativeX * fovX;
      const moveY = relativeY * fovY;
      
      console.log(`Image: ${imageWidth}x${imageHeight}, Click: (${pixelX}, ${pixelY}), Center: (${centerX}, ${centerY})`);
      console.log(`Relative: (${relativeX.toFixed(3)}, ${relativeY.toFixed(3)}), Moving stage by: X=${moveX.toFixed(2)}µm, Y=${moveY.toFixed(2)}µm`);
      
      // Move stage to the clicked position (relative movement)
      await apiPositionerControllerMovePositioner({
        axis: "X",
        dist: moveX,
        isAbsolute: false,
        isBlocking: false
      });
      
      await apiPositionerControllerMovePositioner({
        axis: "Y", 
        dist: -moveY, // Invert Y as microscope Y often goes opposite to image Y
        isAbsolute: false,
        isBlocking: false
      });
    } catch (error) {
      console.error("Failed to move stage:", error);
    }
  };

  // Handle HUD data updates from LiveViewerGL
  const handleHudDataUpdate = useCallback((data) => {
    setHudData(prevData => {
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
        JSON.stringify(prevData.featureSupport) !== JSON.stringify(data.featureSupport);
      
      return hasChanged ? data : prevData;
    });
  }, []);

  return ( 
    <div style={{ 
      position: "relative", 
      width: "100%", 
      overflow: "hidden",
      display: "flex",
      flexDirection: "column"
    }}>
        <div style={{ 
          position: "relative", 
          flex: "1",
          width: "100%", 
          maxHeight: "calc(100vh - 220px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
        {/* Re-enable WebGL/UC2F viewer with metadata-assisted parsing */}
        {useWebGL ? (
          <LiveViewerGL 
            onDoubleClick={handleImageDoubleClick}
            onImageLoad={(width, height) => {
              // Optional: handle image load events
              //console.log(`Image loaded: ${width}x${height}`);
            }}
            onHudDataUpdate={handleHudDataUpdate}
          />
        ) : (
          <LiveViewComponent 
            useFastMode={useFastMode} 
            onDoubleClick={handleImageDoubleClick}
          />
        )}
        </div>
        <div style={{ position: "absolute", bottom: "10px", left: "0px", zIndex: 2, opacity: 0.8 }}>
        <PositionControllerComponent />
        </div>
    </div>
  );
}

export default LiveViewControlWrapper;



import LiveViewComponent from "./LiveViewComponent";
import LiveViewerGL from "../components/LiveViewerGL";
import PositionControllerComponent from "./PositionControllerComponent";
import apiPositionerControllerMovePositioner from "../backendapi/apiPositionerControllerMovePositioner";
import { useSelector } from "react-redux";
import * as objectiveSlice from "../state/slices/ObjectiveSlice.js";

const LiveViewControlWrapper = ({ useFastMode = true, useWebGL = true }) => {
  const objectiveState = useSelector(objectiveSlice.getObjectiveState);

  // Handle double-click for stage movement
  const handleImageDoubleClick = async (pixelX, pixelY) => {
    try {
      // Calculate real-world position from pixel coordinates
      // This assumes the image is centered and uses the FOV to calculate movement
      const fovX = objectiveState.fovX || 1000; // fallback FOV in microns
      
      // For now, use a simple calculation - this may need adjustment based on camera orientation
      const moveX = (pixelX - 400) * (fovX / 800); // assuming 800px width, center at 400
      const moveY = (pixelY - 300) * (fovX / 800) * (3/4); // assuming 600px height, 4:3 aspect ratio
      
      console.log(`Moving stage by: X=${moveX.toFixed(2)}µm, Y=${moveY.toFixed(2)}µm`);
      
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

  return ( 
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <div style={{ position: "relative", top: "0px", left: "0px", zIndex: 1, width: "100%", height: "100%" }}>
        {useWebGL ? (
          <LiveViewerGL 
            onDoubleClick={handleImageDoubleClick}
            onImageLoad={(width, height) => {
              // Optional: handle image load events
              console.log(`Image loaded: ${width}x${height}`);
            }}
          />
        ) : (
          <LiveViewComponent useFastMode={useFastMode} />
        )}
        </div>
        <div style={{ position: "absolute", bottom: "200px", left: "0px", zIndex: 2, }}>
        <PositionControllerComponent />
        </div>
    </div>
  );
}

export default LiveViewControlWrapper;


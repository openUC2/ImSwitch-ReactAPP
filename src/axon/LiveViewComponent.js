import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { Box, Slider, Typography } from "@mui/material";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import * as liveViewSlice from "../state/slices/LiveStreamSlice.js";
import * as objectiveSlice from "../state/slices/ObjectiveSlice.js";
import apiPositionerControllerMovePositioner from "../backendapi/apiPositionerControllerMovePositioner.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * LiveViewComponent - Unified image viewer with intensity scaling
 * 
 * Uses optimized pixel-based intensity windowing for proper scientific image processing.
 * This provides linear intensity mapping: [minVal, maxVal] → [0, 255]
 * 
 * @param {boolean} useFastMode - Use optimized processing for better performance (default: true)
 */
const LiveViewComponent = ({ useFastMode = true, onDoubleClick }) => {
    // redux dispatcher
    const dispatch = useDispatch();

    // Access global Redux state
    const liveStreamState = useSelector(liveViewSlice.getLiveStreamState);
    const objectiveState = useSelector(objectiveSlice.getObjectiveState);

    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
    const [displayScale, setDisplayScale] = useState(1);
    const [canvasStyle, setCanvasStyle] = useState({});

        // Optimized intensity windowing - proper scientific image processing
    const applyIntensityWindowing = useCallback((image, minVal, maxVal) => {
      const canvas = canvasRef.current;
      if (!canvas || !image) return;

      canvas.width = image.width;
      canvas.height = image.height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Calculate the intensity range
      const range = Math.max(1, maxVal - minVal); // Avoid division by zero
      const scale = 255.0 / range;

      // Apply linear intensity windowing: [minVal, maxVal] → [0, 255]
      for (let i = 0; i < data.length; i += 4) {
        // Get original intensity (assuming grayscale, use red channel)
        const originalIntensity = data[i];
        
        // Apply windowing
        let adjustedIntensity;
        if (originalIntensity <= minVal) {
          adjustedIntensity = 0;
        } else if (originalIntensity >= maxVal) {
          adjustedIntensity = 255;
        } else {
          adjustedIntensity = (originalIntensity - minVal) * scale;
        }
        
        // Apply to all color channels (grayscale)
        data[i] = adjustedIntensity;     // Red
        data[i + 1] = adjustedIntensity; // Green  
        data[i + 2] = adjustedIntensity; // Blue
        // Alpha channel (i + 3) remains unchanged
      }

      ctx.putImageData(imageData, 0, 0);
    }, []);

    // Monitor container size changes
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          setContainerSize({ width, height });
        }
      });

      resizeObserver.observe(container);

      // Initial size
      const rect = container.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });

      return () => resizeObserver.disconnect();
    }, []);

    // Calculate responsive canvas dimensions
    const getDisplayDimensions = useCallback((imageWidth, imageHeight) => {
      
      if (!imageWidth || !imageHeight) {
        console.log('Missing image dimensions, using fallback');
        return { width: 400, height: 300 };
      }
      
      if (!containerSize.width || !containerSize.height) {
        console.log('Missing container size, using fallback');
        return { width: 400, height: 300 };
      }

      const imageAspectRatio = imageWidth / imageHeight;
      
      // Match container width exactly as requested
      // Always use the full container width and scale height accordingly
      const displayWidth = Math.floor(containerSize.width);
      const displayHeight = Math.floor(containerSize.width / imageAspectRatio);
      
      
      return { width: displayWidth, height: displayHeight };
    }, [containerSize]);

    // Legacy pixel-perfect intensity scaling (for compatibility)
    const applyPixelIntensityScaling = useCallback((image, minVal, maxVal) => {
      // This method is now deprecated - use applyIntensityWindowing instead
      return applyIntensityWindowing(image, minVal, maxVal);
    }, [applyIntensityWindowing]);
    // Apply responsive sizing to the image
    const applyResponsiveSizing = useCallback((image) => {
      if (!image) return;

      // Get display dimensions based on current container size
      const displayDimensions = getDisplayDimensions(image.width, image.height);
      
      // Calculate display scale factor for scale bar based on actual display size
      const scale = displayDimensions.width > 0 && image.width > 0 ? displayDimensions.width / image.width : 1;
      setDisplayScale(scale);

      // Apply proper intensity windowing (scientific image processing)
      applyIntensityWindowing(image, liveStreamState.minVal, liveStreamState.maxVal);
      
      setCanvasStyle({
        width: `${displayDimensions.width}px`,
        height: `${displayDimensions.height}px`,
        display: 'block',
        margin: '20px auto', // Center the canvas horizontally
        objectFit: 'contain'
      });
    }, [applyIntensityWindowing, getDisplayDimensions, liveStreamState.minVal, liveStreamState.maxVal, containerSize]);

    // Load and process image when it changes
    useEffect(() => {
      if (liveStreamState.liveViewImage) {
        const img = new Image();
        img.onload = () => {
          try {
            // Set canvas to image's natural size
            const canvas = canvasRef.current;
            if (canvas) {
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
            }
            applyResponsiveSizing(img);
            setImageLoaded(true);
          } catch (error) {
            console.error('Error processing image:', error);
            setImageLoaded(false);
            setCanvasStyle({}); // Reset canvas style on error
          }
        };
        img.onerror = () => {
          console.error('Error loading image');
          setImageLoaded(false);
          setCanvasStyle({}); // Reset canvas style on error
        };
        img.src = `data:image/jpeg;base64,${liveStreamState.liveViewImage}`; // TODO: We could consider rendering the fraame into a canvas
      } else {
        setImageLoaded(false);
        setCanvasStyle({}); // Reset canvas style when no image
      }
    }, [liveStreamState.liveViewImage, applyResponsiveSizing]); // TODO: @gokugiant => let's check if this re-renders/repaints the whole page with every frame

    // Reapply sizing when container size changes
    useEffect(() => {
      if (imageLoaded && liveStreamState.liveViewImage) {
        const img = new Image();
        img.onload = () => applyResponsiveSizing(img);
        img.src = `data:image/jpeg;base64,${liveStreamState.liveViewImage}`;
      }
    }, [containerSize, imageLoaded, liveStreamState.liveViewImage, applyResponsiveSizing]);

    // Update intensity windowing when min/max values change
    useEffect(() => {
      if (imageLoaded && liveStreamState.liveViewImage) {
        // Re-apply intensity windowing when intensity values change
        const img = new Image();
        img.onload = () => {
          applyIntensityWindowing(img, liveStreamState.minVal, liveStreamState.maxVal);
        };
        img.src = `data:image/jpeg;base64,${liveStreamState.liveViewImage}`;
      }
    }, [liveStreamState.minVal, liveStreamState.maxVal, imageLoaded, liveStreamState.liveViewImage, applyIntensityWindowing]);

    // Handle container resize to maintain aspect ratio
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const resizeObserver = new ResizeObserver(() => {
        // Reprocess the image when container size changes
        if (liveStreamState.liveViewImage && imageLoaded) {
          const img = new Image();
          img.onload = () => {
            applyResponsiveSizing(img);
          };
          img.src = `data:image/jpeg;base64,${liveStreamState.liveViewImage}`;
        }
      });

      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    }, [liveStreamState.liveViewImage, imageLoaded, applyResponsiveSizing]);

    // Handle intensity range change
    const handleRangeChange = (event, newValue) => {
      dispatch(liveViewSlice.setMinVal(newValue[0]));
      dispatch(liveViewSlice.setMaxVal(newValue[1]));
    };

    // Move positioner to specified real-world coordinates
    const moveToPosition = useCallback(async (x, y) => {
      try {
        console.log(`Moving to position X: ${x.toFixed(2)}, Y: ${y.toFixed(2)} µm`);
        
        // Move X axis
        await apiPositionerControllerMovePositioner({
          axis: "X",
          dist: x,
          isAbsolute: false,
          isBlocking: false,
        });

        // Move Y axis
        await apiPositionerControllerMovePositioner({
          axis: "Y", 
          dist: y,
          isAbsolute: false,
          isBlocking: false,
        });

        console.log(`Successfully moved to position X: ${x.toFixed(2)}, Y: ${y.toFixed(2)} µm`);
      } catch (error) {
        console.error('Error moving to position:', error);
      }
    }, []);

    // Calculate adaptive pixel size based on field of view and canvas dimensions
    const getAdaptivePixelSize = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas || !objectiveState.fovX || canvas.width === 0) {
        return null;
      }
      return objectiveState.fovX / canvas.width;
    }, [objectiveState.fovX]);

    // Handle double-click to move to position
    const handleCanvasDoubleClick = useCallback((event) => {
      const canvas = canvasRef.current;
      
      if (!canvas) {
        console.warn('Canvas not available for position calculation');
        return;
      }

      // Get click position relative to canvas
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      const clickX = (event.clientX - rect.left) * scaleX;
      const clickY = (event.clientY - rect.top) * scaleY;

      // If external handler is provided, use it with image dimensions
      if (onDoubleClick) {
        onDoubleClick(clickX, clickY, canvas.width, canvas.height);
        return;
      }

      // Fallback to original logic if no external handler
      const adaptivePixelSize = getAdaptivePixelSize();
      
      if (!adaptivePixelSize) {
        console.warn('Field of view (fovX) not available for position calculation');
        return;
      }

      // Convert pixel coordinates to real-world coordinates
      // Center of image is (0,0) in real coordinates
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Calculate real-world distances from center using adaptive pixel size
      const realX = (clickX - centerX) * adaptivePixelSize;
      const realY = (clickY - centerY) * adaptivePixelSize;

      console.log(`Double-click at pixel (${clickX.toFixed(1)}, ${clickY.toFixed(1)}) -> real coordinates (${realX.toFixed(2)}, ${realY.toFixed(2)}) µm`);
      console.log(`Adaptive pixel size: ${adaptivePixelSize.toFixed(4)} µm/pixel (fovX: ${objectiveState.fovX}, canvas width: ${canvas.width})`);

      // Move to the calculated position
      // Note: Y direction might need to be inverted depending on stage orientation
      moveToPosition(-realX, -realY); // Inverting Y as microscope Y often goes opposite to image Y
    }, [onDoubleClick, getAdaptivePixelSize, moveToPosition, objectiveState.fovX]);

    // Calculate scale bar dimensions - using adaptive pixel size
    const scaleBarPx = 50;
    const adaptivePixelSize = getAdaptivePixelSize();
    const scaleBarMicrons = adaptivePixelSize ? (scaleBarPx * adaptivePixelSize).toFixed(2) : null;

    // Prepare histogram data for chart.js
    const histogramData = {
      labels: liveStreamState.histogramX,
      datasets: [{ 
        label: "Histogram", 
        data: liveStreamState.histogramY, 
        borderWidth: 1,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
      }],
    };
    
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: "Histogram", color: '#fff' },
      },
      scales: { 
        x: { max: 255, ticks: { color: '#fff' },         callback: (value) => Number(value).toFixed(1) }, // TODO: round number values
        y: { beginAtZero: true, ticks: { color: '#fff' } }
      },
    };

  return (
    <Box ref={containerRef} sx={{ 
      position: "relative", 
      width: "80%", 
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "black",
      overflow: "hidden"
    }}>
      {/* Canvas for intensity-scaled image */}
      {liveStreamState.liveViewImage ? (
        <canvas
          ref={canvasRef}
          style={{
            ...canvasStyle,
            display: imageLoaded ? canvasStyle.display : 'none',
            cursor: adaptivePixelSize ? 'crosshair' : 'default'
          }}
          onDoubleClick={handleCanvasDoubleClick}
        />
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Typography>Loading image...</Typography>
        </Box>
      )}

      {/* Scale bar */}
      {scaleBarMicrons && (
        <Box
          sx={{
            position: "absolute",
            bottom: 50,
            transform: "translateX(-10%)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            zIndex: 4,
          }}
        >
          <Box
            sx={{ width: `${scaleBarPx}px`, height: "10px", backgroundColor: "white", mr: 2 }}
          />
          <Typography variant="body2">{scaleBarMicrons} µm</Typography>
        </Box>
      )}

      {/* Histogram Overlay */}
      {liveStreamState.showHistogram && liveStreamState.histogramX.length > 0 && liveStreamState.histogramY.length > 0 && (
        <Box
          sx={{
            position: "absolute",
            top: 10,
            left: 10,
            width: 200,
            height: 200,
            backgroundColor: "rgba(0,0,0,0.7)",
            zIndex: 5,
            p: 1,
            borderRadius: 1,
          }}
        >
          <Bar data={histogramData} options={chartOptions} />
        </Box>
      )}
    </Box>
  );
};

export default LiveViewComponent;

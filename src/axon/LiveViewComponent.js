import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { Box, Slider, Typography } from "@mui/material";
import * as liveViewSlice from "../state/slices/LiveStreamSlice.js";

/**
 * LiveViewComponent - Unified image viewer with intensity scaling
 * 
 * Performance Note: By default, this component uses CSS filters for intensity scaling
 * which is hardware-accelerated and much more efficient than pixel manipulation.
 * Set usePixelPerfectScaling=true if you need exact pixel-level accuracy.
 * 
 * @param {boolean} usePixelPerfectScaling - Use CPU-intensive pixel manipulation for exact results (default: false)
 */
const LiveViewComponent = ({ usePixelPerfectScaling = false }) => {
    // redux dispatcher
    const dispatch = useDispatch();

    // Access global Redux state
    const liveStreamState = useSelector(liveViewSlice.getLiveStreamState);

    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [displayScale, setDisplayScale] = useState(1);
    const [canvasStyle, setCanvasStyle] = useState({});

    // Calculate CSS filters for intensity scaling (much more efficient than pixel manipulation)
    const calculateIntensityFilters = useCallback((minVal, maxVal) => {
      // For intensity scaling, we want to map [minVal, maxVal] to [0, 255]
      // This is equivalent to: output = (input - minVal) * (255 / (maxVal - minVal))
      
      if (maxVal <= minVal) return 'none'; // Avoid division by zero
      
      const range = maxVal - minVal;
      
      // CSS brightness() adjusts the overall brightness (multiplies all values)
      // CSS contrast() stretches/compresses the dynamic range around 50% gray
      
      // First, we need to shift the range so minVal becomes 0
      // Then scale so the range becomes full 0-255
      
      // This approximates intensity windowing using CSS filters
      const contrast = 255 / range;
      const brightness = 1 - (minVal / 255) * contrast;
      
      // Clamp values to reasonable ranges to avoid extreme visual effects
      const clampedContrast = Math.max(0.1, Math.min(10, contrast));
      const clampedBrightness = Math.max(0.1, Math.min(10, brightness));
      
      return `brightness(${clampedBrightness}) contrast(${clampedContrast})`;
    }, []);

    // Legacy pixel-perfect intensity scaling (CPU intensive but accurate)
    const applyPixelIntensityScaling = useCallback((image, minVal, maxVal) => {
      const canvas = canvasRef.current;
      if (!canvas || !image) return;

      const ctx = canvas.getContext('2d');
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);

      // Get image data for pixel manipulation
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Apply intensity scaling
      const scaleIntensity = 255 / (maxVal - minVal);
      for (let i = 0; i < data.length; i += 4) {
        // For each pixel (RGBA)
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Convert to grayscale for intensity scaling
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // Apply intensity scaling
        let scaledGray = (gray - minVal) * scaleIntensity;
        scaledGray = Math.max(0, Math.min(255, scaledGray));

        // Apply back to RGB channels
        data[i] = scaledGray;     // R
        data[i + 1] = scaledGray; // G
        data[i + 2] = scaledGray; // B
        // Alpha channel (i + 3) remains unchanged
      }

      // Put the modified image data back
      ctx.putImageData(imageData, 0, 0);
    }, []);
    // Apply responsive sizing to the image
    const applyResponsiveSizing = useCallback((image) => {
      const container = containerRef.current;
      if (!image || !container) return;

      // Get container dimensions
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      // Ensure container has valid dimensions
      if (containerWidth === 0 || containerHeight === 0) {
        console.warn('Container dimensions not available yet, skipping scale calculation');
        return;
      }

      // Calculate scale to fit while maintaining aspect ratio
      const imageAspectRatio = image.width / image.height;
      const containerAspectRatio = containerWidth / containerHeight;

      let displayWidth, displayHeight;

      if (imageAspectRatio > containerAspectRatio) {
        // Image is wider than container - fit to width
        displayWidth = containerWidth;
        displayHeight = containerWidth / imageAspectRatio;
      } else {
        // Image is taller than container - fit to height
        displayHeight = containerHeight;
        displayWidth = containerHeight * imageAspectRatio;
      }

      // Calculate display scale factor for scale bar based on actual display size
      const scale = displayWidth > 0 && image.width > 0 ? displayWidth / image.width : 1;
      setDisplayScale(scale);

      // Choose scaling method based on prop
      if (usePixelPerfectScaling) {
        // Use legacy pixel manipulation for exact results
        applyPixelIntensityScaling(image, liveStreamState.minVal, liveStreamState.maxVal);
        setCanvasStyle({
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
          maxWidth: '100%',
          maxHeight: '100%',
          display: 'block',
          margin: '0 auto', // Center the canvas horizontally
        });
      } else {
        // Use efficient CSS filters (default)
        setCanvasStyle({
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
          maxWidth: '100%',
          maxHeight: '100%',
          display: 'block',
          margin: '0 auto', // Center the canvas horizontally
          filter: calculateIntensityFilters(liveStreamState.minVal, liveStreamState.maxVal)
        });
      }
    }, [calculateIntensityFilters, liveStreamState.minVal, liveStreamState.maxVal, usePixelPerfectScaling, applyPixelIntensityScaling]);

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
        img.src = `data:image/jpeg;base64,${liveStreamState.liveViewImage}`;
      } else {
        setImageLoaded(false);
        setCanvasStyle({}); // Reset canvas style when no image
      }
    }, [liveStreamState.liveViewImage, applyResponsiveSizing]);

    // Update intensity filters when min/max values change (only for CSS filter mode)
    useEffect(() => {
      if (imageLoaded && canvasStyle.width && !usePixelPerfectScaling) {
        setCanvasStyle(prevStyle => ({
          ...prevStyle,
          filter: calculateIntensityFilters(liveStreamState.minVal, liveStreamState.maxVal)
        }));
      } else if (usePixelPerfectScaling && liveStreamState.liveViewImage && imageLoaded) {
        // Re-apply pixel-perfect scaling when intensity values change
        const img = new Image();
        img.onload = () => {
          applyPixelIntensityScaling(img, liveStreamState.minVal, liveStreamState.maxVal);
        };
        img.src = `data:image/jpeg;base64,${liveStreamState.liveViewImage}`;
      }
    }, [liveStreamState.minVal, liveStreamState.maxVal, imageLoaded, calculateIntensityFilters, usePixelPerfectScaling, liveStreamState.liveViewImage, applyPixelIntensityScaling]);

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

    // Calculate scale bar dimensions - using original fixed styling
    const scaleBarPx = 50;
    const scaleBarMicrons = liveStreamState.pixelSize ? (scaleBarPx * liveStreamState.pixelSize).toFixed(2) : null;

  return (
    <Box ref={containerRef} sx={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Canvas for intensity-scaled image */}
      {liveStreamState.liveViewImage ? (
        <canvas
          ref={canvasRef}
          style={{
            ...canvasStyle,
            display: imageLoaded ? canvasStyle.display : 'none'
          }}
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
            bottom: 100,
            left: "60%",
            transform: "translateX(-50%)",
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
      {/* Intensity scaling sliders */}
      <Box
        sx={{
          position: "absolute",
          top: 10,
          right: 10,
          height: "80%",
          display: "flex",
          alignItems: "center",
          zIndex: 6,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          borderRadius: 1,
          p: 1,
        }}
      >
        <Slider
          orientation="vertical"
          value={[liveStreamState.minVal, liveStreamState.maxVal]}
          onChange={handleRangeChange}
          min={0}
          max={255}
          valueLabelDisplay="on"
          valueLabelFormat={(v, i) => (i ? `Max: ${v}` : `Min: ${v}`)}
          sx={{ height: "80%", mr: 1 }}
        />
        <Typography
          variant="body2"
          sx={{ color: "#fff", writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          Intensity
        </Typography>
      </Box>
    </Box>
  );
};

export default LiveViewComponent;

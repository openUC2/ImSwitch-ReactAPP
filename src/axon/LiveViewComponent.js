import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { Box, Slider, Typography } from "@mui/material";
import * as liveViewSlice from "../state/slices/LiveStreamSlice.js";

const LiveViewComponent = () => {
    // redux dispatcher
    const dispatch = useDispatch();
  
    // Access global Redux state
    const liveStreamState = useSelector(liveViewSlice.getLiveStreamState);

    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [displayScale, setDisplayScale] = useState(1);

    // Apply intensity scaling to the image using canvas
    const applyIntensityScaling = useCallback((image, minVal, maxVal) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !image || !container) return;

      const ctx = canvas.getContext('2d');
      canvas.width = image.width;
      canvas.height = image.height;

      // Draw the original image
      ctx.drawImage(image, 0, 0);

      // Calculate display scale factor for scale bar
      // Since we're setting canvas width to 100% and height to auto,
      // the scale is based on the container width vs image width
      const containerRect = container.getBoundingClientRect();
      const scale = containerRect.width / image.width;
      setDisplayScale(scale);

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

    // Load and process image when it changes
    useEffect(() => {
      if (liveStreamState.liveViewImage) {
        const img = new Image();
        img.onload = () => {
          try {
            applyIntensityScaling(img, liveStreamState.minVal, liveStreamState.maxVal);
            setImageLoaded(true);
          } catch (error) {
            console.error('Error applying intensity scaling:', error);
            setImageLoaded(false);
          }
        };
        img.onerror = () => {
          console.error('Error loading image');
          setImageLoaded(false);
        };
        img.src = `data:image/jpeg;base64,${liveStreamState.liveViewImage}`;
      }
    }, [liveStreamState.liveViewImage, liveStreamState.minVal, liveStreamState.maxVal, applyIntensityScaling]);

    // Handle intensity range change
    const handleRangeChange = (event, newValue) => {
      dispatch(liveViewSlice.setMinVal(newValue[0]));
      dispatch(liveViewSlice.setMaxVal(newValue[1]));
    };

    // Calculate scale bar dimensions  
    const scaleBarPixelsOriginal = 50; // 50 pixels in the original image
    const scaleBarPixelsDisplay = scaleBarPixelsOriginal * displayScale; // Adjust for display scaling
    const scaleBarMicrons = liveStreamState.pixelSize ? (scaleBarPixelsOriginal * liveStreamState.pixelSize).toFixed(2) : null;

  return (
    <Box ref={containerRef} sx={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Canvas for intensity-scaled image */}
      {liveStreamState.liveViewImage ? (
        <canvas
          ref={canvasRef}
          style={{ 
            width: '100%', 
            height: 'auto',
            maxHeight: '100%',
            display: imageLoaded ? 'block' : 'none'
          }}
        />
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Typography>Loading image...</Typography>
        </Box>
      )}

      {/* Scale bar */}
      {scaleBarMicrons && displayScale > 0 && (
        <Box
          sx={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            zIndex: 4,
          }}
        >
          <Box
            sx={{ width: `${scaleBarPixelsDisplay}px`, height: "10px", backgroundColor: "white", mr: 2 }}
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

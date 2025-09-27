import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { Box, Slider, Typography, Paper } from "@mui/material";
import * as liveStreamSlice from "../state/slices/LiveStreamSlice.js";
import { processUC2FPacket, checkFeatureSupport } from "../stream/uc2f.js";

/**
 * WebGL2-based 16-bit image viewer with window/level controls and zoom/pan
 * Receives binary UC2F packets via window events and renders via WebGL2 R16UI textures
 * Falls back to Canvas2D for unsupported browsers
 */
const LiveViewerGL = ({ onDoubleClick, onImageLoad }) => {
  const dispatch = useDispatch();
  const liveStreamState = useSelector(liveStreamSlice.getLiveStreamState);
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const glRef = useRef(null);
  const programRef = useRef(null);
  const textureRef = useRef(null);
  const frameBufferRef = useRef(null);
  
  // View state
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [viewTransform, setViewTransform] = useState({ scale: 1, translateX: 0, translateY: 0 });
  const [featureSupport, setFeatureSupport] = useState({ webgl2: false, intTextures: false, lz4: false });
  const [stats, setStats] = useState({ fps: 0, bps: 0, compressionRatio: 0 });
  const [isWebGL, setIsWebGL] = useState(false);
  const [currentImageData, setCurrentImageData] = useState(null); // Store current image for histogram
  
  // FPS counter
  const fpsCounterRef = useRef({
    frames: 0,
    lastTime: performance.now(),
    bytesReceived: 0,
    compressedBytes: 0
  });

  // Histogram computation counter
  const histogramCounterRef = useRef(0);

  // WebGL2 shaders
  const vertexShaderSource = `#version 300 es
    in vec2 a_position;
    in vec2 a_texCoord;
    uniform mat3 u_transform;
    out vec2 v_texCoord;
    
    void main() {
      vec3 pos = u_transform * vec3(a_position, 1.0);
      gl_Position = vec4(pos.xy, 0.0, 1.0);
      v_texCoord = a_texCoord;
    }
  `;

  const fragmentShaderSource = `#version 300 es
    precision highp float;
    precision highp usampler2D;
    
    in vec2 v_texCoord;
    uniform usampler2D u_texture;
    uniform float u_min;
    uniform float u_max;
    uniform float u_gamma;
    out vec4 fragColor;
    
    void main() {
      uint rawValue = texture(u_texture, v_texCoord).r;
      float normalized = float(rawValue);
      
      // Apply window/level
      float windowed = clamp((normalized - u_min) / (u_max - u_min), 0.0, 1.0);
      
      // Apply gamma correction
      float gamma_corrected = pow(windowed, 1.0 / u_gamma);
      
      fragColor = vec4(gamma_corrected, gamma_corrected, gamma_corrected, 1.0);
    }
  `;

  // Canvas2D fallback shader (software implementation)
  const applyWindowLevelGamma = useCallback((imageData, width, height, minVal, maxVal, gamma) => {
    const data = imageData.data;
    const scale = 255.0 / Math.max(1, maxVal - minVal);
    
    for (let i = 0; i < data.length; i += 4) {
      // Get luminance (assuming grayscale)
      let value = data[i]; // Use red channel
      
      // Apply window/level
      let windowed;
      if (value <= minVal) {
        windowed = 0;
      } else if (value >= maxVal) {
        windowed = 255;
      } else {
        windowed = (value - minVal) * scale;
      }
      
      // Apply gamma
      const gamma_corrected = Math.pow(windowed / 255.0, 1.0 / gamma) * 255;
      
      data[i] = gamma_corrected;     // R
      data[i + 1] = gamma_corrected; // G  
      data[i + 2] = gamma_corrected; // B
      // Alpha channel (i + 3) remains unchanged
    }
  }, []);

  // Initialize WebGL2 context and shaders
  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const gl = canvas.getContext('webgl2');
    if (!gl) {
      console.warn('WebGL2 not supported, falling back to Canvas2D');
      return false;
    }

    glRef.current = gl;

    // Check for integer texture support
    if (!gl.R16UI || !gl.RED_INTEGER || !gl.UNSIGNED_SHORT) {
      console.warn('Integer textures not supported, falling back to Canvas2D');
      return false;
    }

    // Create and compile shaders
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    // Check compilation
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error('Vertex shader compilation failed:', gl.getShaderInfoLog(vertexShader));
      return false;
    }
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error('Fragment shader compilation failed:', gl.getShaderInfoLog(fragmentShader));
      return false;
    }

    // Create program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking failed:', gl.getProgramInfoLog(program));
      return false;
    }

    programRef.current = program;

    // Set up geometry (fullscreen quad)
    const positions = new Float32Array([
      -1, -1,  0, 1,
       1, -1,  1, 1,
      -1,  1,  0, 0,
       1,  1,  1, 0,
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    // Set up vertex attributes
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
    
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 16, 8);

    // Create texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    textureRef.current = texture;

    return true;
  }, []);

  // Upload 16-bit data to WebGL2 texture
  const uploadTexture = useCallback((u16Data, width, height) => {
    const gl = glRef.current;
    const texture = textureRef.current;
    
    if (!gl || !texture) return;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,                    // level
      gl.R16UI,            // internal format
      width,
      height,
      0,                    // border
      gl.RED_INTEGER,      // format
      gl.UNSIGNED_SHORT,   // type
      u16Data
    );
  }, []);

  // Render frame with current uniforms
  const renderFrame = useCallback(() => {
    const gl = glRef.current;
    const program = programRef.current;
    
    if (!gl || !program) return;

    const canvas = canvasRef.current;
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    gl.useProgram(program);

    // Update uniforms
    const minLocation = gl.getUniformLocation(program, 'u_min');
    const maxLocation = gl.getUniformLocation(program, 'u_max');
    const gammaLocation = gl.getUniformLocation(program, 'u_gamma');
    const transformLocation = gl.getUniformLocation(program, 'u_transform');

    gl.uniform1f(minLocation, liveStreamState.minVal || 0);
    gl.uniform1f(maxLocation, liveStreamState.maxVal || 65535);
    gl.uniform1f(gammaLocation, liveStreamState.gamma || 1.0);

    // Apply view transform
    const { scale, translateX, translateY } = viewTransform;
    const transform = new Float32Array([
      scale, 0, translateX,
      0, scale, translateY,
      0, 0, 1
    ]);
    gl.uniformMatrix3fv(transformLocation, false, transform);

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, [liveStreamState.minVal, liveStreamState.maxVal, liveStreamState.gamma, viewTransform]);

  // Canvas2D fallback rendering
  const renderCanvas2D = useCallback((u16Data, width, height) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Convert 16-bit to 8-bit with window/level
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    
    const minVal = liveStreamState.minVal || 0;
    const maxVal = liveStreamState.maxVal || 65535;
    const scale = 255.0 / Math.max(1, maxVal - minVal);
    
    for (let i = 0; i < u16Data.length; i++) {
      const value = u16Data[i];
      let scaled;
      
      if (value <= minVal) {
        scaled = 0;
      } else if (value >= maxVal) {
        scaled = 255;
      } else {
        scaled = (value - minVal) * scale;
      }
      
      const idx = i * 4;
      data[idx] = scaled;     // R
      data[idx + 1] = scaled; // G
      data[idx + 2] = scaled; // B
      data[idx + 3] = 255;    // A
    }
    
    // Apply gamma correction
    applyWindowLevelGamma(imageData, width, height, 0, 255, liveStreamState.gamma || 1.0);
    
    // Clear and draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(imageData, 0, 0);
  }, [liveStreamState.minVal, liveStreamState.maxVal, liveStreamState.gamma, applyWindowLevelGamma]);

  // Update FPS stats
  const updateStats = useCallback((compressedSize, uncompressedSize) => {
    const counter = fpsCounterRef.current;
    counter.frames++;
    counter.bytesReceived += uncompressedSize;
    counter.compressedBytes += compressedSize;
    
    const now = performance.now();
    const elapsed = now - counter.lastTime;
    
    if (elapsed >= 1000) { // Update every second
      const fps = Math.round((counter.frames * 1000) / elapsed);
      const bps = Math.round((counter.bytesReceived * 8) / (elapsed / 1000)); // bits per second
      const compressionRatio = counter.bytesReceived > 0 ? 
        Math.round((counter.compressedBytes / counter.bytesReceived) * 100) / 100 : 0;
      
      setStats({ fps, bps, compressionRatio });
      
      // Update Redux stats
      dispatch(liveStreamSlice.setStats?.({ fps, bps, compressionRatio }));
      
      // Reset counters
      counter.frames = 0;
      counter.bytesReceived = 0;
      counter.compressedBytes = 0;
      counter.lastTime = now;
    }
  }, [dispatch]);

  // Compute histogram from 16-bit data (client-side)
  const computeHistogram = useCallback((u16Data, width, height) => {
    // Only compute histogram every 5th frame to avoid performance issues
    histogramCounterRef.current++;
    if (histogramCounterRef.current % 5 !== 0) return;

    // Use requestIdleCallback if available, otherwise setTimeout
    const computeAsync = (callback) => {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(callback);
      } else {
        setTimeout(callback, 0);
      }
    };

    computeAsync(() => {
      try {
        const binCount = 4096; // Coarse histogram for performance
        const maxValue = 65535; // 16-bit max
        const binSize = maxValue / binCount;
        
        const histogram = new Array(binCount).fill(0);
        const histogramX = new Array(binCount);
        
        // Initialize x-axis values
        for (let i = 0; i < binCount; i++) {
          histogramX[i] = Math.round(i * binSize);
        }
        
        // Count pixel values
        for (let i = 0; i < u16Data.length; i++) {
          const value = u16Data[i];
          const bin = Math.min(Math.floor(value / binSize), binCount - 1);
          histogram[bin]++;
        }
        
        // Update Redux with histogram data
        dispatch(liveStreamSlice.setHistogramData({
          x: histogramX,
          y: histogram
        }));
        
      } catch (error) {
        console.warn('Histogram computation failed:', error);
      }
    });
  }, [dispatch]);

  // Handle binary frame events
  const handleFrameEvent = useCallback((event) => {
    try {
      const buffer = event.detail;
      const packet = processUC2FPacket(buffer);
      
      setImageSize({ width: packet.width, height: packet.height });
      setCurrentImageData(packet.dataU16); // Store for histogram computation
      
      if (onImageLoad) {
        onImageLoad(packet.width, packet.height);
      }
      
      // Update stats
      updateStats(packet.compSize, packet.dataU16.length * 2);
      
      // Compute histogram (async, throttled)
      computeHistogram(packet.dataU16, packet.width, packet.height);
      
      if (isWebGL) {
        uploadTexture(packet.dataU16, packet.width, packet.height);
        renderFrame();
      } else {
        renderCanvas2D(packet.dataU16, packet.width, packet.height);
      }
      
    } catch (error) {
      console.error('Frame processing error:', error);
    }
  }, [isWebGL, uploadTexture, renderFrame, renderCanvas2D, onImageLoad, updateStats, computeHistogram]);

  // Initialize component
  useEffect(() => {
    const support = checkFeatureSupport();
    setFeatureSupport(support);
    
    const webglSuccess = support.webgl2 && support.intTextures && initWebGL();
    setIsWebGL(webglSuccess);
    
    if (!webglSuccess) {
      console.log('Using Canvas2D fallback');
    }
  }, [initWebGL]);

  // Listen for frame events
  useEffect(() => {
    window.addEventListener('uc2:frame', handleFrameEvent);
    
    return () => {
      window.removeEventListener('uc2:frame', handleFrameEvent);
    };
  }, [handleFrameEvent]);

  // Re-render when uniforms change
  useEffect(() => {
    if (isWebGL && imageSize.width > 0) {
      renderFrame();
    }
  }, [isWebGL, imageSize, renderFrame]);

  // Handle mouse interactions for zoom/pan
  const handleWheel = useCallback((event) => {
    event.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Zoom factor
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    
    setViewTransform(prev => {
      const newScale = Math.max(0.1, Math.min(10, prev.scale * zoomFactor));
      
      // Zoom towards cursor position
      const mouseX = (x / canvas.width) * 2 - 1;
      const mouseY = 1 - (y / canvas.height) * 2;
      
      const newTranslateX = prev.translateX + (mouseX - prev.translateX) * (1 - zoomFactor);
      const newTranslateY = prev.translateY + (mouseY - prev.translateY) * (1 - zoomFactor);
      
      return {
        scale: newScale,
        translateX: newTranslateX,
        translateY: newTranslateY
      };
    });
  }, []);

  const handleDoubleClick = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas || !onDoubleClick) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert screen coordinates to image coordinates
    const { scale, translateX, translateY } = viewTransform;
    
    // Normalize to [-1, 1] range
    const normX = (x / canvas.width) * 2 - 1;
    const normY = 1 - (y / canvas.height) * 2;
    
    // Apply inverse transform
    const imageX = (normX - translateX) / scale;
    const imageY = (normY - translateY) / scale;
    
    // Convert to image pixel coordinates
    const pixelX = ((imageX + 1) / 2) * imageSize.width;
    const pixelY = ((1 - imageY) / 2) * imageSize.height;
    
    onDoubleClick(pixelX, pixelY);
  }, [viewTransform, imageSize, onDoubleClick]);

  const resetView = useCallback(() => {
    setViewTransform({ scale: 1, translateX: 0, translateY: 0 });
  }, []);

  return (
    <Box ref={containerRef} sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          cursor: 'crosshair'
        }}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
      />
      
      {/* HUD */}
      <Paper 
        sx={{ 
          position: 'absolute', 
          top: 10, 
          right: 10, 
          p: 1, 
          opacity: 0.8,
          fontSize: '12px'
        }}
      >
        <Typography variant="caption" display="block">
          {isWebGL ? 'WebGL2' : 'Canvas2D'} | {featureSupport.lz4 ? 'LZ4' : 'No LZ4'}
        </Typography>
        <Typography variant="caption" display="block">
          FPS: {stats.fps} | {(stats.bps / 1000000).toFixed(1)} Mbps
        </Typography>
        <Typography variant="caption" display="block">
          Compression: {stats.compressionRatio}x
        </Typography>
        <Typography variant="caption" display="block">
          {imageSize.width}x{imageSize.height} | Zoom: {viewTransform.scale.toFixed(2)}x
        </Typography>
      </Paper>
      
      {/* Reset button */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          opacity: 0.7,
          '&:hover': { opacity: 1 },
          cursor: 'pointer',
          bgcolor: 'background.paper',
          p: 1,
          borderRadius: 1
        }}
        onClick={resetView}
      >
        <Typography variant="caption">Reset View</Typography>
      </Box>
    </Box>
  );
};

export default LiveViewerGL;
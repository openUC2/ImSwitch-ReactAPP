import { createSlice } from "@reduxjs/toolkit";
import { setFovX } from "./ObjectiveSlice";

// Define the initial state
const initialLiveStreamState = {
  // Image data removed - handled directly by viewer components
  // liveViewImage: "", // REMOVED: no longer store pixel data in Redux
  minVal: 0,
  maxVal: 65535, // Updated for 16-bit range
  gamma: 1.0, // New: gamma correction
  imageFormat: "unknown", // Track image format (jpeg, raw, etc.)
  pixelSize: null,
  fovX: 0,
  fovY: 0, 
  // Backend capability detection
  isLegacyBackend: false,
  backendCapabilities: {
    binaryStreaming: true,
    webglSupported: true
  },
  // Histogram data
  histogramX: [],
  histogramY: [],
  showHistogram: false,
  // View transform state (optional - can be local to component)
  zoom: 1.0,
  translateX: 0,
  translateY: 0,
  // Stream statistics
  stats: {
    fps: 0,
    bps: 0, // bits per second
    compressionRatio: 0
  }
};

// Create slice
const liveStreamSlice = createSlice({
  name: "liveStreamState",
  initialState: initialLiveStreamState,
  reducers: {
    setLiveViewImage: (state, action) => {
      state.liveViewImage = action.payload;
    },
    
    setMinVal: (state, action) => {
      state.minVal = action.payload;
    },

    setMaxVal: (state, action) => {
      state.maxVal = action.payload;
    },

    setImageFormat: (state, action) => {
      state.imageFormat = action.payload;
    },

    setGamma: (state, action) => {
      state.gamma = action.payload;
    },

    setIsLegacyBackend: (state, action) => {
      state.isLegacyBackend = action.payload;
      // Automatically disable binary streaming for legacy backends
      if (action.payload) {
        state.backendCapabilities.binaryStreaming = false;
        state.backendCapabilities.webglSupported = false;
      }
    },

    setBackendCapabilities: (state, action) => {
      state.backendCapabilities = { ...state.backendCapabilities, ...action.payload };
    },

    setZoom: (state, action) => {
      state.zoom = action.payload;
    },

    setTranslate: (state, action) => {
      state.translateX = action.payload.x;
      state.translateY = action.payload.y;
    },

    setStats: (state, action) => {
      state.stats = { ...state.stats, ...action.payload };
    },

    setPixelSize: (state, action) => {
      state.pixelSize = action.payload;
    },


    setHistogramData: (state, action) => {
      state.histogramX = action.payload.x;
      state.histogramY = action.payload.y;
    },

    setShowHistogram: (state, action) => {
      state.showHistogram = action.payload;
    },

    resetState: (state) => {
      console.log("resetState");
      return { ...initialLiveStreamState }; // Reset to initial state
    },
  },
});

// Export actions from slice
export const {
  setLiveViewImage,
  setMinVal,
  setMaxVal,
  setImageFormat,
  setGamma,
  setIsLegacyBackend,
  setBackendCapabilities,
  setZoom,
  setTranslate,
  setStats,
  setPixelSize,
  setFovY,
  setHistogramData,
  setShowHistogram,
  resetState,
} = liveStreamSlice.actions;

// Selector helper
export const getLiveStreamState = (state) => state.liveStreamState;

// Export reducer from slice
export default liveStreamSlice.reducer;

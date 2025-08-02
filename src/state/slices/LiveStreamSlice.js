import { createSlice } from "@reduxjs/toolkit";
import { setFovX } from "./ObjectiveSlice";

// Define the initial state
const initialLiveStreamState = {
  liveViewImage: "",
  minVal: 0,
  maxVal: 255,
  pixelSize: null,
  fovX: 0,
  fovY: 0, 
  // Histogram data
  histogramX: [],
  histogramY: [],
  showHistogram: false,
};

// Create slice
const liveStreamSlice = createSlice({
  name: "liveStreamState",
  initialState: initialLiveStreamState,
  reducers: {
    setLiveViewImage: (state, action) => {
      //console.log("setLiveViewImage");
      //console.log(action.payload);
      state.liveViewImage = action.payload;
    },

    setMinVal: (state, action) => {
      state.minVal = action.payload;
    },

    setMaxVal: (state, action) => {
      state.maxVal = action.payload;
    },

    setPixelSize: (state, action) => {
      state.pixelSize = action.payload;
    },

    setFovX: (state, action) => {
      console.log("setFovX", action.payload);
      state.fovX = action.payload;
      
    },
    
    setFovY: (state, action) => {
      console.log("setFovY", action.payload);
      state.fovY = action.payload;
      
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
  setPixelSize,
  setFovX,
  setFovY,
  setHistogramData,
  setShowHistogram,
  resetState,
} = liveStreamSlice.actions;

// Selector helper
export const getLiveStreamState = (state) => state.liveStreamState;

// Export reducer from slice
export default liveStreamSlice.reducer;

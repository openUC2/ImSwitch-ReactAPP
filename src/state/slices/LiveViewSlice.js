import { createSlice } from "@reduxjs/toolkit";

// Define the initial state
const initialLiveViewState = {
  detectors: [],
  activeTab: 0,
  imageUrls: {},
  pollImageUrl: null,
  pixelSize: null,
  isStreamRunning: false,
  
  // Widget-related state
  sliderValue: 0,
  generic: { init: "init" },
};

// Create slice
const liveViewSlice = createSlice({
  name: "liveViewState",
  initialState: initialLiveViewState,
  reducers: {
    setDetectors: (state, action) => {
      state.detectors = action.payload;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setImageUrls: (state, action) => {
      state.imageUrls = action.payload;
    },
    setPollImageUrl: (state, action) => {
      state.pollImageUrl = action.payload;
    },
    setPixelSize: (state, action) => {
      state.pixelSize = action.payload;
    },
    setIsStreamRunning: (state, action) => {
      state.isStreamRunning = action.payload;
    },
    setSliderValue: (state, action) => {
      state.sliderValue = action.payload;
    },
    setGeneric: (state, action) => {
      state.generic = action.payload;
    },
    updateGeneric: (state, action) => {
      const { key, value } = action.payload;
      state.generic = {
        ...state.generic,
        [key]: value,
      };
    },
    resetState: (state) => {
      return initialLiveViewState;
    },
  },
});

// Export actions from slice
export const {
  setDetectors,
  setActiveTab,
  setImageUrls,
  setPollImageUrl,
  setPixelSize,
  setIsStreamRunning,
  setSliderValue,
  setGeneric,
  updateGeneric,
  resetState,
} = liveViewSlice.actions;

// Selector helper
export const getLiveViewState = (state) => state.liveViewState;

// Export reducer from slice
export default liveViewSlice.reducer;
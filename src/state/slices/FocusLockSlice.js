import { createSlice } from "@reduxjs/toolkit";

// Define the initial state
const initialFocusLockState = {
  // Focus lock status
  isFocusLocked: false,
  isCalibrating: false,
  
  // PI Controller parameters
  multiplier: 1.0,
  kp: 0.1,
  ki: 0.01,
  
  // Astigmatism parameters
  gaussianSigma: 1.0,
  backgroundThreshold: 100.0,
  cropSize: 100,
  cropCenter: [0, 0],
  
  // Images
  lastImage: null,
  lastCroppedImage: null,
  
  // Focus values for graph (last 50 points)
  focusValues: [],
  focusTimepoints: [],
  maxFocusHistory: 50,
  
  // Current focus value
  currentFocusValue: 0.0,
  setPointSignal: 0.0,
  
  // UI state
  selectedCropRegion: null,
  showImageSelector: false,
  isLoadingImage: false,
};

// Create slice
const focusLockSlice = createSlice({
  name: "focusLockState",
  initialState: initialFocusLockState,
  reducers: {
    // Focus lock control
    setFocusLocked: (state, action) => {
      state.isFocusLocked = action.payload;
    },
    setIsCalibrating: (state, action) => {
      state.isCalibrating = action.payload;
    },
    
    // PI Controller parameters
    setMultiplier: (state, action) => {
      state.multiplier = action.payload;
    },
    setKp: (state, action) => {
      state.kp = action.payload;
    },
    setKi: (state, action) => {
      state.ki = action.payload;
    },
    
    // Astigmatism parameters
    setGaussianSigma: (state, action) => {
      state.gaussianSigma = action.payload;
    },
    setBackgroundThreshold: (state, action) => {
      state.backgroundThreshold = action.payload;
    },
    setCropSize: (state, action) => {
      state.cropSize = action.payload;
    },
    setCropCenter: (state, action) => {
      state.cropCenter = action.payload;
    },
    
    // Images
    setLastImage: (state, action) => {
      state.lastImage = action.payload;
    },
    setLastCroppedImage: (state, action) => {
      state.lastCroppedImage = action.payload;
    },
    
    // Focus values
    addFocusValue: (state, action) => {
      const { focusValue, setPointSignal, timestamp } = action.payload;
      
      // Add new values
      state.focusValues.push(focusValue);
      state.focusTimepoints.push(timestamp);
      state.currentFocusValue = focusValue;
      state.setPointSignal = setPointSignal;
      
      // Keep only last 50 values
      if (state.focusValues.length > state.maxFocusHistory) {
        state.focusValues.shift();
        state.focusTimepoints.shift();
      }
    },
    clearFocusHistory: (state) => {
      state.focusValues = [];
      state.focusTimepoints = [];
    },
    
    // UI state
    setSelectedCropRegion: (state, action) => {
      state.selectedCropRegion = action.payload;
    },
    setShowImageSelector: (state, action) => {
      state.showImageSelector = action.payload;
    },
    setIsLoadingImage: (state, action) => {
      state.isLoadingImage = action.payload;
    },
    
    // Reset state
    resetState: (state) => {
      return { ...initialFocusLockState };
    },
  },
});

// Export actions
export const {
  setFocusLocked,
  setIsCalibrating,
  setMultiplier,
  setKp,
  setKi,
  setGaussianSigma,
  setBackgroundThreshold,
  setCropSize,
  setCropCenter,
  setLastImage,
  setLastCroppedImage,
  addFocusValue,
  clearFocusHistory,
  setSelectedCropRegion,
  setShowImageSelector,
  setIsLoadingImage,
  resetState,
} = focusLockSlice.actions;

// Selector helper
export const getFocusLockState = (state) => state.focusLockState;

// Export reducer
export default focusLockSlice.reducer;
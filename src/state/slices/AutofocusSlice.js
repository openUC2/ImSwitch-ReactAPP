// AutofocusSlice.js
import { createSlice } from "@reduxjs/toolkit";

// Define the initial state for autofocus
const initialAutofocusState = {
  // Autofocus parameters
  rangeZ: 10,
  resolutionZ: 1,
  defocusZ: 0,
  
  // Runtime state
  isRunning: false,
  
  // Plot data - focus positions and contrast values
  plotData: null, // { x: [...], y: [...] } where x = positions, y = contrast
  
  // UI state
  showPlot: false,
};

// Create autofocus slice
const autofocusSlice = createSlice({
  name: "autofocusState",
  initialState: initialAutofocusState,
  reducers: {
    // Parameter setters
    setRangeZ: (state, action) => {
      state.rangeZ = action.payload;
    },
    setResolutionZ: (state, action) => {
      state.resolutionZ = action.payload;
    },
    setDefocusZ: (state, action) => {
      state.defocusZ = action.payload;
    },
    
    // Runtime state
    setIsRunning: (state, action) => {
      state.isRunning = action.payload;
    },
    
    // Plot data
    setPlotData: (state, action) => {
      // action.payload should be { x: [...], y: [...] }
      state.plotData = action.payload;
    },
    clearPlotData: (state) => {
      state.plotData = null;
    },
    
    // UI state
    setShowPlot: (state, action) => {
      state.showPlot = action.payload;
    },
    toggleShowPlot: (state) => {
      state.showPlot = !state.showPlot;
    },
    
    // Reset state
    resetState: (state) => {
      return { ...initialAutofocusState };
    },
  },
});

// Export actions
export const {
  setRangeZ,
  setResolutionZ,
  setDefocusZ,
  setIsRunning,
  setPlotData,
  clearPlotData,
  setShowPlot,
  toggleShowPlot,
  resetState,
} = autofocusSlice.actions;

// Selector helper
export const getAutofocusState = (state) => state.autofocusState;

// Export reducer
export default autofocusSlice.reducer;

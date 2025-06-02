import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // UI state
  tabIndex: 0,

  // Position and movement parameters
  minPos: 0,
  maxPos: 1000,
  speed: 1000,
  axis: "A",

  // Illumination parameters
  illuSource: -1,
  illuValue: 512,

  // Imaging state
  vtkImagePrimary: null,
  isRunning: false,
};

const lightsheetSlice = createSlice({
  name: "lightsheet",
  initialState,
  reducers: {
    // UI actions
    setTabIndex: (state, action) => {
      state.tabIndex = action.payload;
    },

    // Position and movement actions
    setMinPos: (state, action) => {
      state.minPos = action.payload;
    },
    setMaxPos: (state, action) => {
      state.maxPos = action.payload;
    },
    setSpeed: (state, action) => {
      state.speed = action.payload;
    },
    setAxis: (state, action) => {
      state.axis = action.payload;
    },

    // Illumination actions
    setIlluSource: (state, action) => {
      state.illuSource = action.payload;
    },
    setIlluValue: (state, action) => {
      state.illuValue = action.payload;
    },

    // Imaging actions
    setVtkImagePrimary: (state, action) => {
      state.vtkImagePrimary = action.payload;
    },
    setIsRunning: (state, action) => {
      state.isRunning = action.payload;
    },

    // Batch update actions
    setPositionParameters: (state, action) => {
      const { minPos, maxPos, speed, axis } = action.payload;
      state.minPos = minPos;
      state.maxPos = maxPos;
      state.speed = speed;
      state.axis = axis;
    },
    setIlluminationParameters: (state, action) => {
      const { source, value } = action.payload;
      state.illuSource = source;
      state.illuValue = value;
    },

    // Reset actions
    resetToDefaults: (state) => {
      return { ...initialState };
    },
    resetScan: (state) => {
      state.isRunning = false;
      state.vtkImagePrimary = null;
    },
  },
});

// Export actions
export const {
  setTabIndex,
  setMinPos,
  setMaxPos,
  setSpeed,
  setAxis,
  setIlluSource,
  setIlluValue,
  setVtkImagePrimary,
  setIsRunning,
  setPositionParameters,
  setIlluminationParameters,
  resetToDefaults,
  resetScan,
} = lightsheetSlice.actions;

// Export selector
export const getLightsheetState = (state) => state.lightsheet;

// Export reducer
export default lightsheetSlice.reducer;
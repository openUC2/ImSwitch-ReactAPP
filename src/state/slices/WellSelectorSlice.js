import { createSlice } from '@reduxjs/toolkit';

// Define the initial state for wellSelectorState
const initialWellSelectorState = {
  mode: 'single',          // string: could be 'default', 'select', 'edit', etc.
  rasterWidth: 64.0,          // float: size of the raster grid width
  rasterHeight: 32.0,          // float: size of the raster grid height
  overlapWidth: 0.0,          // float: size of the overlap between the rasters
  overlapHeight: 0.0,          // float: size of the overlap between the rasters
  pointNeighbors: 1,          // int: size of the surrounding points
};

// Create wellSelectorState slice
const wellSelectorSlice = createSlice({
  name: 'wellSelectorState',
  initialState: initialWellSelectorState,
  reducers: {
    setMode: (state, action) => {
        console.log("setMode");
        state.mode = action.payload;
    },
    setRasterWidth: (state, action) => {
        console.log("setRasterWidth");
        state.rasterWidth = action.payload;
    },
    setRasterHeight: (state, action) => {
        console.log("setRasterHeight");
        state.rasterHeight = action.payload;
    },
    setOverlapWidth: (state, action) => {
        console.log("setOverlapWidth");
        state.overlapWidth = action.payload;
    },
    setOverlapHeight: (state, action) => {
        console.log("setOverlapHeight");
        state.overlapHeight = action.payload;
    },
    setPointNeighbors: (state, action) => {
        console.log("setPointNeighbors");
        state.pointNeighbors = action.payload;
    },
    setMouseDownFlag: (state, action) => {
        console.log("setMouseDownFlag");
        state.mouseDownFlag = action.payload;
    },
    resetState: (state) => {
        console.log("resetState");
        return { ...initialWellSelectorState }; // Reset to initial state
    }
  },
});

// Export actions from  slice
export const { 
  setMode, 
  setRasterWidth,
  setRasterHeight,
  setOverlapWidth,
  setOverlapHeight,
  setPointNeighbors, 
  resetState 
} = wellSelectorSlice.actions;

// Selector helper
export const getWellSelectorState = (state) => state.wellSelectorState;

// Export reducer from  slice
export default wellSelectorSlice.reducer;

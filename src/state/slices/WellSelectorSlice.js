import { createSlice } from '@reduxjs/toolkit';

// Define the initial state for wellSelectorState
const initialWellSelectorState = {
  mode: 'single',          // string: could be 'default', 'select', 'edit', etc.
  overlapWidth: 0.0,          // float: size of the overlap between the rasters
  overlapHeight: 0.0,          // float: size of the overlap between the rasters
  showOverlap: true,          // bool: show overlap or not 
  cameraTargetPosition: { x: 0.0, y: 0.0 },          // float: x position of the camera target 
  savedBoundingBox: null,          // object: bounding box of the selected wells
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
    setOverlapWidth: (state, action) => {
        console.log("setOverlapWidth");
        state.overlapWidth = action.payload;
        if(isNaN(state.overlapWidth)){
            state.overlapWidth = 0;
        }
    },
    setOverlapHeight: (state, action) => {
        console.log("setOverlapHeight");
        state.overlapHeight = action.payload;
    },
    setMouseDownFlag: (state, action) => {
        console.log("setMouseDownFlag");
        state.mouseDownFlag = action.payload;
    },
    setShowOverlap: (state, action) => {
        console.log("setShowOverlap");
        state.showOverlap = action.payload;	
    },
    setCameraTargetPosition: (state, action) => {
        console.log("setCameraTargetPosition");
        state.cameraTargetPosition = action.payload;	
    },
    resetState: (state) => {
        console.log("resetState");
        return { ...initialWellSelectorState }; // Reset to initial state
    },
    setSavedBoundingBox: (state, action) => {
      state.savedBoundingBox = action.payload;
    },
  },
});

// Export actions from  slice
export const { 
  setMode, 
  setOverlapWidth,
  setOverlapHeight,
  setShowOverlap,
  setCameraTargetPosition,
  resetState,
  setSavedBoundingBox
} = wellSelectorSlice.actions;

// Selector helper
export const getWellSelectorState = (state) => state.wellSelectorState;

// Export reducer from  slice
export default wellSelectorSlice.reducer;

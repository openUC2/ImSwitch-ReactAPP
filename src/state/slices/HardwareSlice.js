import { createSlice } from "@reduxjs/toolkit";

// Define the initial state
const initialHardwareState = {
  position: {
    x: 0,
    y: 0,
    z: 0,
    a: 0,
  },
  parameterRange: { 
    illumination: ["a", "b", "c"],
    laserWaveLength: [10, 20, 30],
    timeLapsePeriod: { min: 0, max: 1000 },
    numberOfImages: { min: 1, max: 1000 },
    autoFocus: { min: 1, max: 1000 },
    autoFocusStepSize: { min: 0.1, max: 10 },
    zStack: { min: -10, max: 20 },
    zStackStepSize: { min: 0.1, max: 10 },
  },
};

// Create slice
const hardwareSlice = createSlice({
  name: "hardwareState",
  initialState: initialHardwareState,
  reducers: {
    setPosition: (state, action) => {
      //console.log("setPosition");
      //console.log(action.payload);
      state.position.x = action.payload.x;
      state.position.y = action.payload.y;
      state.position.z = action.payload.z;
      state.position.a = action.payload.a;
    },
    setParamaeterRange: (state, action) => {
      //console.log("setParamaeterRange");
      //console.log(action.payload);
      state.parameterRange = action.payload; 
    },

    resetState: (state) => {
      console.log("resetState");
      return { ...initialHardwareState }; // Reset to initial state
    },
  },
});

// Export actions from slice
export const {
  setPosition, 
  setParamaeterRange,
  resetState,
} = hardwareSlice.actions;

// Selector helper
export const getHardwareState = (state) => state.hardwareState;

// Export reducer from slice
export default hardwareSlice.reducer;

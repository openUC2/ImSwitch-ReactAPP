import { createSlice } from "@reduxjs/toolkit";

// Define the initial state
const initialHardwareState = {
  liveViewImage: "",
  position: {
    x: 0,
    y: 0,
    z: 0,
    a: 0,
  },
};

// Create slice
const hardwareSlice = createSlice({
  name: "hardwareState",
  initialState: initialHardwareState,
  reducers: {
    setLiveViewImage: (state, action) => {
      //console.log("setLiveViewImage");
      //console.log(action.payload);
      state.liveViewImage = action.payload;
    },
    setPosition: (state, action) => {
      //console.log("setPosition");
      //console.log(action.payload);
      state.position.x = action.payload.x;
      state.position.y = action.payload.y;
      state.position.z = action.payload.z;
      state.position.a = action.payload.a;
    },

    resetState: (state) => {
      console.log("resetState");
      return { ...initialHardwareState }; // Reset to initial state
    },
  },
});

// Export actions from slice
export const {
  setLiveViewImage,
  setPosition, 
  resetState,
} = hardwareSlice.actions;

// Selector helper
export const getHardwareState = (state) => state.hardwareState;

// Export reducer from slice
export default hardwareSlice.reducer;

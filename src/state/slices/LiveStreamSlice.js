import { createSlice } from "@reduxjs/toolkit";

// Define the initial state
const initialLiveStreamState = {
  liveViewImage: "",
  minVal: 0,
  maxVal: 255,
  pixelSize: null,
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
  resetState,
} = liveStreamSlice.actions;

// Selector helper
export const getLiveStreamState = (state) => state.liveStreamState;

// Export reducer from slice
export default liveStreamSlice.reducer;

import { createSlice } from "@reduxjs/toolkit";



// Define the initial state
const initialParameterRangeState = {
    illumination: ["a", "b", "c"],
    laserWaveLength: [10, 20, 30],
    timeLapsePeriod: { min: 0, max: 1000 },
    numberOfImages: { min: 1, max: 1000 },
    autoFocus: { min: 1, max: 1000 },
    autoFocusStepSize: { min: 0.1, max: 10 },
    zStack: { min: -10, max: 20 },
    zStackStepSize: { min: 0.1, max: 10 },
    speed: [1,5,10,50,100,500,1000,10000,20000,100000]
};

// Create slice
const parameterRangeSlice = createSlice({
  name: "parameterRangeState",
  initialState: initialParameterRangeState,
  reducers: {

    resetState: () => {
        return { ...initialParameterRangeState }; // Reset to initial state
      },
  
      //TODO Add universal setter for all parameters. -> questionable whether the parsing instructions from api to state should be done here

      // Setters for each parameter
      setIllumination: (state, action) => {
        state.illumination = action.payload;
      },
      setLaserWaveLength: (state, action) => {
        state.laserWaveLength = action.payload;
      },
      setTimeLapsePeriodMin: (state, action) => {
        state.timeLapsePeriod.min = action.payload;
      },
      setTimeLapsePeriodMax: (state, action) => {
        state.timeLapsePeriod.max = action.payload;
      },
      setNumberOfImagesMin: (state, action) => {
        state.numberOfImages.min = action.payload;
      },
      setNumberOfImagesMax: (state, action) => {
        state.numberOfImages.max = action.payload;
      },
      setAutoFocusMin: (state, action) => {
        state.autoFocus.min = action.payload;
      },
      setAutoFocusMax: (state, action) => {
        state.autoFocus.max = action.payload;
      },
      setAutoFocusStepSizeMin: (state, action) => {
        state.autoFocusStepSize.min = action.payload;
      },
      setAutoFocusStepSizeMax: (state, action) => {
        state.autoFocusStepSize.max = action.payload;
      },
      setZStackMin: (state, action) => {
        state.zStack.min = action.payload;
      },
      setZStackMax: (state, action) => {
        state.zStack.max = action.payload;
      },
      setZStackStepSizeMin: (state, action) => {
        state.zStackStepSize.min = action.payload;
      },
      setZStackStepSizeMax: (state, action) => {
        state.zStackStepSize.max = action.payload;
      },
      setSpeed: (state, action) => {
        state.speed = action.payload;
      },
  },
});

// Export actions from slice
export const {  
    resetState,
    setIllumination,
    setLaserWaveLength,
    setTimeLapsePeriodMin,
    setTimeLapsePeriodMax,
    setNumberOfImagesMin,
    setNumberOfImagesMax,
    setAutoFocusMin,
    setAutoFocusMax,
    setAutoFocusStepSizeMin,
    setAutoFocusStepSizeMax,
    setZStackMin,
    setZStackMax,
    setZStackStepSizeMin,
    setZStackStepSizeMax,
    setSpeed
  } = parameterRangeSlice.actions;

// Selector helper
export const getParameterRangeState = (state) => state.parameterRangeState;

// Export reducer from slice
export default parameterRangeSlice.reducer;

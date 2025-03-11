import { createSlice } from "@reduxjs/toolkit";

// Define the initial state
const initialObjectiveState = {
  fovX: 40000,
  fovY: 20000,

  currentObjective: 0,
  objectivName: "",
  
  pixelsize: 0.0,
  NA: 0.0,
  magnification: 0,
  posX1: 0,
  posX2: 0,
};

// Create slice
const objectiveSlice = createSlice({
  name: "objectiveState",
  initialState: initialObjectiveState,
  reducers: {
    setFovX: (state, action) => {
      console.log("setFovX", action.payload);
      state.fovX = action.payload;
    },
    setFovY: (state, action) => {
      console.log("setFovY", action.payload);
      state.fovY = action.payload;
    },
    setCurrentObjective: (state, action) => {
      console.log("setCurrentObjective", action.payload);
      state.currentObjective = action.payload;
    },
    setObjectiveName: (state, action) => {
      console.log("setObjectiveName", action.payload);
      state.objectivName = action.payload;
    },
    setPixelSize: (state, action) => {
      console.log("setPixelSize", action.payload);
      state.pixelsize = action.payload;
    },
    setNA: (state, action) => {
      console.log("setNA", action.payload);
      state.NA = action.payload;
    },
    setMagnification: (state, action) => {
      console.log("setMagnification", action.payload);
      state.magnification = action.payload;
    },
    setPosX1: (state, action) => {
      console.log("setPosX1", action.payload);
      state.posX1 = action.payload;
    },
    setPosX2: (state, action) => {
      console.log("setPosX2", action.payload);
      state.posX2 = action.payload;
    },

    resetState: (state) => {
      console.log("resetState");
      return { ...initialObjectiveState }; // Reset to initial state
    },
  },
});

// Export actions from slice
export const {
  setFovX,
  setFovY,
  setCurrentObjective,
  setObjectiveName,
  setPixelSize,
  setNA,
  setMagnification,
  setPosX1,
  setPosX2,
  resetState,
} = objectiveSlice.actions;

// Selector helper
export const getObjectiveState = (state) => state.objectiveState;

// Export reducer from slice
export default objectiveSlice.reducer;

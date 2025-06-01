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
  posZ1: 0,
  posZ2: 0,
  magnification1: 0,
  magnification2: 0,
  
  // Additional state for ObjectiveController
  currentA: "",
  currentZ: "",
  imageUrls: {},
  detectors: [],
  manualX1: "",
  manualX2: "",
  manualZ1: "",
  manualZ2: "",
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
    setmagnification1: (state, action) => {
      console.log("setmagnification1", action.payload);
      state.magnification1 = action.payload;
    },
    setmagnification2: (state, action) => {
      console.log("setmagnification2", action.payload);
      state.magnification2 = action.payload;
    },
    setPosX1: (state, action) => {
      console.log("setPosX1", action.payload);
      state.posX1 = action.payload;
    },
    setPosX2: (state, action) => {
      console.log("setPosX2", action.payload);
      state.posX2 = action.payload;
    },
    setPosZ1: (state, action) => {
      console.log("setPosZ1", action.payload);
      state.posZ1 = action.payload;
    },
    setPosZ2: (state, action) => {
      console.log("setPosZ2", action.payload);
      state.posZ2 = action.payload;
    },
    
    // New reducers for ObjectiveController state
    setCurrentA: (state, action) => {
      state.currentA = action.payload;
    },
    setCurrentZ: (state, action) => {
      state.currentZ = action.payload;
    },
    setImageUrls: (state, action) => {
      state.imageUrls = action.payload;
    },
    setDetectors: (state, action) => {
      state.detectors = action.payload;
    },
    setManualX1: (state, action) => {
      state.manualX1 = action.payload;
    },
    setManualX2: (state, action) => {
      state.manualX2 = action.payload;
    },
    setManualZ1: (state, action) => {
      state.manualZ1 = action.payload;
    },
    setManualZ2: (state, action) => {
      state.manualZ2 = action.payload;
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
  setmagnification1,
  setmagnification2,
  setPosX1,
  setPosX2,
  setPosZ1,
  setPosZ2,
  setCurrentA,
  setCurrentZ,
  setImageUrls,
  setDetectors,
  setManualX1,
  setManualX2,
  setManualZ1,
  setManualZ2,
  resetState,
} = objectiveSlice.actions;

// Selector helper
export const getObjectiveState = (state) => state.objectiveState;

// Export reducer from slice
export default objectiveSlice.reducer;

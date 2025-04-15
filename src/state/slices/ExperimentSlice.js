import { createSlice } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";

// Define the initial state
const initialExperimentState = {
  name: "experiment",
  wellLayout: {
    name: "Default",
    unit: "um",
    width: 1000000,
    height: 600000,
    wells: [
      /* Example well
      { x: 200000, y: 200000, shape: "circle", radius: 50000 },
      { x: 400000, y: 200000, shape: "circle", radius: 90000 },
      { x: 600000, y: 200000, shape: "circle", radius: 90000 },
      { x: 800000, y: 200000, shape: "circle", radius: 90000 },
      { x: 200000, y: 400000, shape: "circle", radius: 90000 },
      { x: 400000, y: 400000, shape: "circle", radius: 90000, name: "A1" },
      { x: 600000, y: 400000, shape: "rectangle", width: 90000, height: 180000, },
      { x: 800000, y: 400000, shape: "rectangle", width: 180000, height: 180000, },
      */
    ],
  },
  pointList: [
    /* Example item:
    {
      id: uuidv4(),
      name: "",
      x: 100000,
      y: 100000,
      shape: "",
      rectPlusX: 0,
      rectMinusX: 0,
      rectPlusY: 0,
      rectMinusY: 0,
      circleRadiusX: 0,
      circleRadiusY: 0
    },
    */
  ],
  parameterValue: {
    illumination: "Brightfield",
    brightfield: false,
    darkfield: false,
    laserWaveLength: 0,
    differentialPhaseContrast: false,
    timeLapsePeriod: 0.1,
    numberOfImages: 1,
    autoFocus: false,
    autoFocusMin: 0.0,
    autoFocusMax: 0.0,
    autoFocusStepSize: 0.1,
    zStack: false,
    zStackMin: 0.0,
    zStackMax: 0.0,
    zStackStepSize: 0.1,
    speed: 0
  },
};

// Create slice
const experimentSlice = createSlice({
  name: "experimentState",
  initialState: initialExperimentState,
  reducers: {
    //------------------------ well layout
    setWellLayout: (state, action) => {
      state.wellLayout = action.payload;
    },
    //------------------------ parameter
    setIllumination: (state, action) => {
      console.log("setIllumination", action.payload);
      state.parameterValue.illumination = action.payload;
    },
    setBrightfield: (state, action) => {
      console.log("setBrightfield");
      state.parameterValue.brightfield = action.payload;
    },
    setDarkfield: (state, action) => {
      console.log("setDarkfield");
      state.parameterValue.darkfield = action.payload;
    },
    setLaserWaveLength: (state, action) => {
      console.log("setLaserWaveLength");
      state.parameterValue.laserWaveLength = action.payload;
    },
    setDifferentialPhaseContrast: (state, action) => {
      console.log("setDifferentialPhaseContrast");
      state.parameterValue.differentialPhaseContrast = action.payload;
    },
    setTimeLapsePeriod: (state, action) => {
      console.log("setTimeLapsePeriod");
      state.parameterValue.timeLapsePeriod = action.payload;
    },
    setNumberOfImages: (state, action) => {
      console.log("setNumberOfImages");
      state.parameterValue.numberOfImages = action.payload;
    },
    setAutoFocus: (state, action) => {
      console.log("setAutoFocus");
      state.parameterValue.autoFocus = action.payload;
    },
    setAutoFocusMin: (state, action) => {
      console.log("setAutoFocusMin");
      state.parameterValue.autoFocusMin = action.payload;
    },
    setAutoFocusMax: (state, action) => {
      console.log("setAutoFocusMax");
      state.parameterValue.autoFocusMax = action.payload;
    },
    setAutoFocusStepSize: (state, action) => {
      console.log("setAutoFocusStepSize");
      state.parameterValue.autoFocusStepSize = action.payload;
    },
    setZStack: (state, action) => {
      console.log("setZStack");
      state.parameterValue.zStack = action.payload;
    },
    setZStackMin: (state, action) => {
      console.log("setZStackMin");
      state.parameterValue.zStackMin = action.payload;
    },
    setZStackMax: (state, action) => {
      console.log("setZStackMax");
      state.parameterValue.zStackMax = action.payload;
    },
    setZStackStepSize: (state, action) => {
      console.log("setZStackStepSize");
      state.parameterValue.zStackStepSize = action.payload;
    },
    setSpeed: (state, action) => {
        console.log("setSpeed");
        state.parameterValue.speed = action.payload;
    },
    //------------------------ generic
    updateParameter: (state, action) => {
      console.log("setParameter", action.payload);
      const { key, value } = action.payload; //Call: updateParameter({parameterName: value})
      if (state.parameterValue.hasOwnProperty(key)) {
        state.parameterValue[key] = value;
      }
    },
    //------------------------ points
    createPoint: (state, action) => {
      console.log("createPoint", action);
      const newPoint = {
        id: uuidv4(),
        x: action.payload.x,
        y: action.payload.y,
        name: (action.payload.name != null) ? (action.payload.name) : (""),
        shape: (action.payload.shape != null) ? (action.payload.shape) : (""),
        rectPlusX: (action.payload.rectPlusX != null) ? (action.payload.rectPlusX) : (0),
        rectPlusY: (action.payload.rectPlusY != null) ? (action.payload.rectPlusY) : (0),
        rectMinusX: (action.payload.rectMinusX != null) ? (action.payload.rectMinusX) : (0),
        rectMinusY: (action.payload.rectMinusY != null) ? (action.payload.rectMinusY) : (0),
        circleRadiusX: (action.payload.circleRadiusX != null) ? (action.payload.circleRadiusX) : (0),
        circleRadiusY: (action.payload.circleRadiusY != null) ? (action.payload.circleRadiusY) : (0),
      };
      
      console.log("createPoint newPoint", newPoint);
      state.pointList.push(newPoint);
    },
    addPoint: (state, action) => {
      console.log("addPoint");
      state.pointList.push(action.payload);
    },
    removePoint: (state, action) => {
      console.log("removePoint");
      //return state.filter(point => point.id !== action.payload);
      state.pointList.splice(action.payload, 1);
    },
    setPointList: (state, action) => {
      console.log("setPointList");
      state.pointList = action.payload;
    },
    replacePoint: (state, action) => {
      console.log("replacePoint", action.payload);
      const { index, newPoint } = action.payload;
      if (index >= 0 && index < state.pointList.length) {
        state.pointList[index] = newPoint;
      }
    },

    //------------------------ state
    resetState: (state) => {
      console.log("resetState");
      return initialExperimentState; // Reset to initial state
    },
  },
});

// Export actions from slice
export const {
  setWellLayout,

  setIllumination,
  setBrightfield,
  setDarkfield,
  setLaserWaveLength,
  setDifferentialPhaseContrast,
  setTimeLapsePeriod,
  setNumberOfImages,
  setAutoFocus,
  setAutoFocusMin,
  setAutoFocusMax,
  setAutoFocusStepSize,
  setZStack,
  setZStackMin,
  setZStackMax,
  setZStackStepSize,
  setSpeed,

  createPoint,
  addPoint,
  removePoint,
  setPointList,
  replacePoint,
} = experimentSlice.actions;

// Selector helper
export const getExperimentState = (state) => state.experimentState;

// Export reducer from slice
export default experimentSlice.reducer;

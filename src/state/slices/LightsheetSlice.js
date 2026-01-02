import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // UI state
  tabIndex: 0,

  // Position and movement parameters
  minPos: -500,
  maxPos: 500,
  speed: 1000,
  axis: "A",

  // Illumination parameters
  illuSource: -1,
  illuValue: 512,

  // Galvo scanner parameters
  galvoChannel: 0,
  galvoFrequency: 1000,
  galvoOffset: 0,
  galvoAmplitude: 1000,
  galvoClkDiv: 1,
  galvoPhase: 0,
  galvoInvert: false,

  // Imaging state
  vtkImagePrimary: null,
  isRunning: false,

  // Current stage positions for 3D visualization
  stagePositions: {
    x: 0,
    y: 0,
    z: 0,
    a: 0
  },

  // Axis configuration for 3D mapping
  axisConfig: {
    x: { offset: 0, scale: 1, invert: false },
    y: { offset: 0, scale: 1, invert: false },
    z: { offset: 0, scale: 1, invert: false },
    a: { offset: 0, scale: 1, invert: false }
  },
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

    // Galvo scanner actions
    setGalvoChannel: (state, action) => {
      state.galvoChannel = action.payload;
    },
    setGalvoFrequency: (state, action) => {
      state.galvoFrequency = action.payload;
    },
    setGalvoOffset: (state, action) => {
      state.galvoOffset = action.payload;
    },
    setGalvoAmplitude: (state, action) => {
      state.galvoAmplitude = action.payload;
    },
    setGalvoClkDiv: (state, action) => {
      state.galvoClkDiv = action.payload;
    },
    setGalvoPhase: (state, action) => {
      state.galvoPhase = action.payload;
    },
    setGalvoInvert: (state, action) => {
      state.galvoInvert = action.payload;
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
    setGalvoParameters: (state, action) => {
      const { channel, frequency, offset, amplitude, clkDiv, phase, invert } = action.payload;
      state.galvoChannel = channel;
      state.galvoFrequency = frequency;
      state.galvoOffset = offset;
      state.galvoAmplitude = amplitude;
      state.galvoClkDiv = clkDiv;
      state.galvoPhase = phase;
      state.galvoInvert = invert;
    },

    // Stage position actions for 3D visualization
    setStagePosition: (state, action) => {
      const { axis, value } = action.payload;
      state.stagePositions[axis] = value;
    },
    setAllStagePositions: (state, action) => {
      state.stagePositions = { ...state.stagePositions, ...action.payload };
    },

    // Axis configuration actions
    setAxisConfig: (state, action) => {
      const { axis, config } = action.payload;
      state.axisConfig[axis] = { ...state.axisConfig[axis], ...config };
    },
    setAxisOffset: (state, action) => {
      const { axis, offset } = action.payload;
      state.axisConfig[axis].offset = offset;
    },
    setAxisScale: (state, action) => {
      const { axis, scale } = action.payload;
      state.axisConfig[axis].scale = scale;
    },
    setAxisInvert: (state, action) => {
      const { axis, invert } = action.payload;
      state.axisConfig[axis].invert = invert;
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
  setGalvoChannel,
  setGalvoFrequency,
  setGalvoOffset,
  setGalvoAmplitude,
  setGalvoClkDiv,
  setGalvoPhase,
  setGalvoInvert,
  setVtkImagePrimary,
  setIsRunning,
  setPositionParameters,
  setIlluminationParameters,
  setGalvoParameters,
  setStagePosition,
  setAllStagePositions,
  setAxisConfig,
  setAxisOffset,
  setAxisScale,
  setAxisInvert,
  resetToDefaults,
  resetScan,
} = lightsheetSlice.actions;

// Export selector
export const getLightsheetState = (state) => state.lightsheet;

// Export reducer
export default lightsheetSlice.reducer;
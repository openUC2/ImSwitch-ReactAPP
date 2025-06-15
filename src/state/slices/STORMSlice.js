import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // UI state
  tabIndex: 0,

  // Experiment parameters
  experimentName: "STORM_Experiment",
  exposureTime: 50, // milliseconds
  
  // Crop region parameters
  cropRegion: {
    x: 0,
    y: 0,
    width: 512,
    height: 512,
  },

  // Laser parameters
  laserIntensities: {},  // Will be populated with available lasers
  
  // Status
  isRunning: false,
  currentFrameNumber: 0,
  
  // Images
  liveStreamImage: null,
  reconstructedImage: null,
};

const stormSlice = createSlice({
  name: "storm",
  initialState,
  reducers: {
    // UI actions
    setTabIndex: (state, action) => {
      state.tabIndex = action.payload;
    },

    // Experiment parameter actions
    setExperimentName: (state, action) => {
      state.experimentName = action.payload;
    },
    setExposureTime: (state, action) => {
      state.exposureTime = action.payload;
    },

    // Crop region actions
    setCropRegion: (state, action) => {
      state.cropRegion = { ...state.cropRegion, ...action.payload };
    },
    setCropX: (state, action) => {
      state.cropRegion.x = action.payload;
    },
    setCropY: (state, action) => {
      state.cropRegion.y = action.payload;
    },
    setCropWidth: (state, action) => {
      state.cropRegion.width = action.payload;
    },
    setCropHeight: (state, action) => {
      state.cropRegion.height = action.payload;
    },

    // Laser actions
    setLaserIntensities: (state, action) => {
      state.laserIntensities = action.payload;
    },
    setLaserIntensity: (state, action) => {
      const { laserName, intensity } = action.payload;
      state.laserIntensities[laserName] = intensity;
    },

    // Status actions
    setIsRunning: (state, action) => {
      state.isRunning = action.payload;
    },
    setCurrentFrameNumber: (state, action) => {
      state.currentFrameNumber = action.payload;
    },

    // Image actions
    setLiveStreamImage: (state, action) => {
      state.liveStreamImage = action.payload;
    },
    setReconstructedImage: (state, action) => {
      state.reconstructedImage = action.payload;
    },

    // Reset actions
    resetExperiment: (state) => {
      state.isRunning = false;
      state.currentFrameNumber = 0;
    },
    resetToDefaults: (state) => {
      return { ...initialState };
    },
  },
});

// Export actions
export const {
  setTabIndex,
  setExperimentName,
  setExposureTime,
  setCropRegion,
  setCropX,
  setCropY,
  setCropWidth,
  setCropHeight,
  setLaserIntensities,
  setLaserIntensity,
  setIsRunning,
  setCurrentFrameNumber,
  setLiveStreamImage,
  setReconstructedImage,
  resetExperiment,
  resetToDefaults,
} = stormSlice.actions;

// Export selector
export const getSTORMState = (state) => state.storm;

// Export reducer
export default stormSlice.reducer;
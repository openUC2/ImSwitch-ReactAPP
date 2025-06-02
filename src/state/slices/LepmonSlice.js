import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // System Status
  isRunning: false,
  currentImageCount: 0,
  serverTime: "",
  deviceTime: "",
  freeSpace: "",
  storagePath: "",
  sharpnessValue: null,

  // Temperature/Environment
  insideTemp: null,
  outsideTemp: null,
  humidity: null,

  // Camera Settings
  exposure: 100,
  gain: 0,
  timelapsePeriod: 60,
  timelapseLocked: true,
  rebootLocked: true,

  // GPS/Location
  lat: null,
  lng: null,

  // Time/Date
  time: "",
  date: "",
};

const lepmonSlice = createSlice({
  name: "lepmon",
  initialState,
  reducers: {
    // System Status actions
    setIsRunning: (state, action) => {
      state.isRunning = action.payload;
    },
    setCurrentImageCount: (state, action) => {
      state.currentImageCount = action.payload;
    },
    setServerTime: (state, action) => {
      state.serverTime = action.payload;
    },
    setDeviceTime: (state, action) => {
      state.deviceTime = action.payload;
    },
    setFreeSpace: (state, action) => {
      state.freeSpace = action.payload;
    },
    setStoragePath: (state, action) => {
      state.storagePath = action.payload;
    },
    setSharpnessValue: (state, action) => {
      state.sharpnessValue = action.payload;
    },

    // Temperature/Environment actions
    setInsideTemp: (state, action) => {
      state.insideTemp = action.payload;
    },
    setOutsideTemp: (state, action) => {
      state.outsideTemp = action.payload;
    },
    setHumidity: (state, action) => {
      state.humidity = action.payload;
    },

    // Camera Settings actions
    setExposure: (state, action) => {
      state.exposure = action.payload;
    },
    setGain: (state, action) => {
      state.gain = action.payload;
    },
    setTimelapsePeriod: (state, action) => {
      state.timelapsePeriod = action.payload;
    },
    setTimelapseLocked: (state, action) => {
      state.timelapseLocked = action.payload;
    },
    setRebootLocked: (state, action) => {
      state.rebootLocked = action.payload;
    },

    // GPS/Location actions
    setLat: (state, action) => {
      state.lat = action.payload;
    },
    setLng: (state, action) => {
      state.lng = action.payload;
    },

    // Time/Date actions
    setTime: (state, action) => {
      state.time = action.payload;
    },
    setDate: (state, action) => {
      state.date = action.payload;
    },

    // Batch update actions for initial data
    setInitialStatus: (state, action) => {
      const { isRunning, currentImageCount, serverTime, freeSpace } = action.payload;
      state.isRunning = isRunning;
      state.currentImageCount = currentImageCount;
      state.serverTime = serverTime;
      state.freeSpace = freeSpace;
    },
    setInitialParams: (state, action) => {
      const { exposureTime, gain, timelapsePeriod, storagePath } = action.payload;
      state.exposure = exposureTime;
      state.gain = gain;
      state.timelapsePeriod = timelapsePeriod;
      state.storagePath = storagePath;
    },
    setTemperatureData: (state, action) => {
      const { innerTemp, outerTemp, humidity } = action.payload;
      state.insideTemp = innerTemp;
      state.outsideTemp = outerTemp;
      state.humidity = humidity;
    },
  },
});

// Export actions
export const {
  setIsRunning,
  setCurrentImageCount,
  setServerTime,
  setDeviceTime,
  setFreeSpace,
  setStoragePath,
  setSharpnessValue,
  setInsideTemp,
  setOutsideTemp,
  setHumidity,
  setExposure,
  setGain,
  setTimelapsePeriod,
  setTimelapseLocked,
  setRebootLocked,
  setLat,
  setLng,
  setTime,
  setDate,
  setInitialStatus,
  setInitialParams,
  setTemperatureData,
} = lepmonSlice.actions;

// Export selector
export const getLepmonState = (state) => state.lepmon;

// Export reducer
export default lepmonSlice.reducer;
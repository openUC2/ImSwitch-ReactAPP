// redux/store.js
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import { combineReducers } from "redux";

// storage types
import storage from "redux-persist/lib/storage";
import storageSession from "redux-persist/lib/storage/session";

// Import slices
import connectionSettingsReducer from "./slices/ConnectionSettingsSlice";
import webSocketReducer from "./slices/WebSocketSlice";
import positionReducer from "./slices/PositionSlice";
import wellSelectorReducer from "./slices/WellSelectorSlice";
import experimentReducer from "./slices/ExperimentSlice";
import experimentStatusReducer from "./slices/ExperimentStatusSlice";
import parameterRangeReducer from "./slices/ParameterRangeSlice";
import liveStreamReducer from "./slices/LiveStreamSlice";
import tileStreamReducer from "./slices/TileStreamSlice";
import objectiveReducer from "./slices/ObjectiveSlice";

//#####################################################################################
// Combine reducers
const rootReducer = combineReducers({
  connectionSettingsState: connectionSettingsReducer,
  webSocketState: webSocketReducer,
  experimentState: experimentReducer,
  experimentStatusState: experimentStatusReducer,
  liveStreamState: liveStreamReducer,
  tileStreamState: tileStreamReducer,
  parameterRangeState: parameterRangeReducer,
  wellSelectorState: wellSelectorReducer,
  objectiveState: objectiveReducer,
  position: positionReducer,
});

//#####################################################################################
// Persist configuration with whitelist and blacklist
// Note: After changing something in a slice, clear the browser cache.
const persistConfig = {
  key: "root",
  storage, //<--storage type
  whitelist: [
    "connectionSettingsState",
    "parameterRangeState",
    "experimentState",
    "wellSelectorState",
    "positionState",
  ],  
  //blacklist: ['webSocketState'],  // Do not persist these
};

//#####################################################################################
// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

//#####################################################################################
// Action creator for syncing the state across tabs
const SYNC_STATE = "SYNC_STATE";

// Action creator for syncing the state across tabs
const syncStateAction = (updatedState) => ({
  type: SYNC_STATE,
  payload: updatedState,
});

// Handle SYNC_STATE action to merge updated state from other tabs
const rootReducerWithSync = (state, action) => {
  // If SYNC_STATE action is dispatched, replace the state with the updated state
  if (action.type === SYNC_STATE) {
    return { ...state, ...action.payload }; // Merge updated state
  }

  // Use the persistedReducer otherwise
  return persistedReducer(state, action);
};

//#####################################################################################
// Sync state across tabs
const syncStateAcrossTabs = () => {
  window.addEventListener("storage", (event) => {
    if (event.key === "persist:root") {
        console.log("State change from another tab detected!");
      const updatedState = JSON.parse(event.newValue);
        // Check if any slice is stringified and needs parsing
        Object.keys(updatedState).forEach(sliceKey => {
            if (typeof updatedState[sliceKey] === "string") {
              updatedState[sliceKey] = JSON.parse(updatedState[sliceKey]);
            }
          });
      // Dispatch SYNC_STATE action with updated state
      store.dispatch(syncStateAction(updatedState));
    }
  });
};

// Activate the sync function
syncStateAcrossTabs();

//#####################################################################################
// Create the Redux store with the sync logic
const store = configureStore({
  reducer: rootReducerWithSync, // Use rootReducerWithSync to manage the state
});

//#####################################################################################
// Persistor setup for Redux-Persist
export const persistor = persistStore(store);

// Export the store
export default store;

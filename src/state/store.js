// redux/store.js
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import { combineReducers } from "redux";

// storage types
import storage from "redux-persist/lib/storage";
import storageSession from "redux-persist/lib/storage/session";

//import slices
//Note: the name "positionReducer" is generated with name out of createSlice() + "Reducer"
import connectionSettingsReducer from "./slices/ConnectionSettingsSlice";
import webSocketReducer from "./slices/WebSocketSlice";
import positionReducer from "./slices/PositionSlice";
import wellSelectorReducer from "./slices/WellSelectorSlice";
import experimentReducer from "./slices/ExperimentSlice";
import experimentStatusReducer from "./slices/ExperimentStatusSlice";
import parameterRangeReducer from "./slices/ParameterRangeSlice";
import liveStreamReducer from "./slices/LiveStreamSlice";
import objectiveReducer from "./slices/ObjectiveSlice";

// Combine reducers
const rootReducer = combineReducers({
  connectionSettingsState: connectionSettingsReducer,
  webSocketState: webSocketReducer,
  experimentState: experimentReducer,
  experimentStatusState: experimentStatusReducer,
  liveStreamState: liveStreamReducer,
  parameterRangeState: parameterRangeReducer,
  wellSelectorState: wellSelectorReducer,
  objectiveState: objectiveReducer,
  position: positionReducer,
});

// Persist configuration with whitelist and blacklist
// Note:
// * after change somthing in a slice you have to delete the browser cache!!!!!!
// Storage types:
// * storage (Data persists across browser sessions until manually cleared by the user or programmatically removed)
// * storageSession (Data is cleared when the tab or browser is closed)
const persistConfig = {
  key: "root",
  storage, //<--storage type
  whitelist: [ //<-- add all slices that should be persisted
    "connectionSettingsState",
    "parameterRangeState",
    "experimentState",
    "wellSelectorState",
    "positionState",
  ],  
  //blacklist: ['webSocketState'],      // Do not persist these
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// create store
const store = configureStore({
  reducer: persistedReducer,
});

// exports
export const persistor = persistStore(store);

export default store;

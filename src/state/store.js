// redux/store.js
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import { combineReducers } from "redux";

// storage types
import storage from "redux-persist/lib/storage";
import storageSession from "redux-persist/lib/storage/session";

//import slices
//Note: the name "positionReducer" is generated with name out of createSlice() + "Reducer"
import webSocketSettingsReducer from "./slices/WebSocketSettingsSlice";
import webSocketConnectionReducer from "./slices/WebSocketConnectionSlice";
import positionReducer from "./slices/PositionSlice";
import wellSelectorReducer from "./slices/WellSelectorSlice";
import experimentReducer from "./slices/ExperimentSlice";
import hardwareReduzer from "./slices/HardwareSlice";
import liveStreamReduzer from "./slices/LiveStreamSlice";

// Combine reducers
const rootReducer = combineReducers({
  webSocketSettingsState: webSocketSettingsReducer,
  webSocketConnectionState: webSocketConnectionReducer,
  experimentState: experimentReducer,
  liveStreamState: liveStreamReduzer,
  hardwareState: hardwareReduzer,
  wellSelectorState: wellSelectorReducer,
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
    "webSocketSettingsState",
    "liveStreamState",
    "hardwareState",
    "experimentState",
    "wellSelectorState",
    "position",
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

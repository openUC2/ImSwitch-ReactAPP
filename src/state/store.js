// redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import { combineReducers } from 'redux';

// storage types
import storage from 'redux-persist/lib/storage';
import storageSession from 'redux-persist/lib/storage/session';

//import slices 
//Note: the name "positionReducer" is generated with name out of createSlice() + "Reducer"
import webSocketReducer from './slices/WebSocketSlice';
import positionReducer from './slices/PositionSlice';
import wellSelectorReducer from './slices/WellSelectorSlice';
import experimentReducer from './slices/ExperimentSlice';
import hardwareReducer from './slices/HardwareSlice';


// Combine reducers
const rootReducer = combineReducers({
    webSocketState: webSocketReducer,
    experimentState: experimentReducer,
    hardwareState: hardwareReducer,
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
    key: 'root',
    storage, //<--storage type
    whitelist: ['hardwareState', 'experimentState', 'wellSelectorState', 'position'],  // Only persist these  
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

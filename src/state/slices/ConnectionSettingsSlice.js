import { createSlice } from '@reduxjs/toolkit';

// Define the initial state  
const initialState = {
    ip: `https://${window.location.hostname}`,//ip: "https://localhost", "https://imswitch.openuc2.com"
    websocketPort: 8002,
    apiPort: 8001,
    //TODO protocol? seperated? http/https
};

// Create webSocketSettingsSlice slice
const connectionSettingsSlice = createSlice({
  name: 'connectionSettingsState',
  initialState: initialState,
  reducers: {
    setIp: (state, action) => {
        console.log("setIp", action.payload);
        state.ip = action.payload;
    },
    setWebsocketPort: (state, action) => {
        console.log("setWebsocketPort", action.payload);
        state.websocketPort = action.payload;
    },
    setApiPort: (state, action) => {
        console.log("setApiPort", action.payload);
        state.apiPort = action.payload;
    },
  
    resetState: (state) => {
        console.log("resetState");
        return { ...initialState }; // Reset to initial state
    }
  },
});

// Export actions from wellSelectorState slice
export const { 
    setIp, 
    setWebsocketPort,
    setApiPort,
    resetState,
} = connectionSettingsSlice.actions;

// Selector helper
export const getConnectionSettingsState = (state) => state.connectionSettingsState;

// Export reducer from wellSelectorState slice
export default connectionSettingsSlice.reducer;

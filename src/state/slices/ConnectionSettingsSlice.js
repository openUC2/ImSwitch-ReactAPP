import { createSlice } from '@reduxjs/toolkit';

// Define the initial state  
const initialState = {
    ip: `https://${window.location.hostname}`,//ip: "https://localhost", "https://imswitch.openuc2.com"
    port: 8002
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
    setPort: (state, action) => {
        console.log("setPort", action.payload);
        state.port = action.payload;
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
    setPort,
    resetState,
} = connectionSettingsSlice.actions;

// Selector helper
export const getConnectionSettingsState = (state) => state.connectionSettingsState;

// Export reducer from wellSelectorState slice
export default connectionSettingsSlice.reducer;

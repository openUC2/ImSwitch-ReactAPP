import { createSlice } from '@reduxjs/toolkit';

// Define the initial state  
const initialState = {
    ip: "https://imswitch.openuc2.com",//ip: "https://localhost",
    port: 8002,
};

// Create webSocketSettingsSlice slice
const webSocketSettingsSlice = createSlice({
  name: 'webSocketSettingsState',
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
} = webSocketSettingsSlice.actions;

// Selector helper
export const getWebSocketSettingsState = (state) => state.webSocketSettingsState;

// Export reducer from wellSelectorState slice
export default webSocketSettingsSlice.reducer;

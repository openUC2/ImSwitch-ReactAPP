import { createSlice } from '@reduxjs/toolkit';

// Define the initial state  
const initialState = {
    ip: "https://imswitch.openuc2.com",//ip: "https://localhost",
    port: 8002,
    connected: false,
    signalCount: 0
};

// Create webSocketState slice
const webSocketStateSlice = createSlice({
  name: 'webSocketState',
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
    setConnected: (state, action) => {
        console.log("setConnected", action.payload);
        state.connected = action.payload;
    },
    incrementSignalCount: (state, action) => {
        //console.log("incrementSignalCount");
        state.signalCount++;
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
    setConnected,
    incrementSignalCount,
    resetState,
} = webSocketStateSlice.actions;

// Selector helper
export const getWebSocketState = (state) => state.webSocketState;

// Export reducer from wellSelectorState slice
export default webSocketStateSlice.reducer;

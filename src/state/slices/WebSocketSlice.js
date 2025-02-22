import { createSlice } from '@reduxjs/toolkit';

// Define the initial state  
const initialState = {
    connected: false,
    signalCount: 0
};

// Create webSocketConnectionSlice slice
const webSocketSlice = createSlice({
  name: 'webSocketState',
  initialState: initialState,
  reducers: {
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

// Export actions from  slice
export const { 
    setIp, 
    setPort,
    setConnected,
    incrementSignalCount,
    resetState,
} = webSocketSlice.actions;

// Selector helper
export const getWebSocketState = (state) => state.webSocketState;

// Export reducer from slice
export default webSocketSlice.reducer;

// redux/positionSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Define initial state for position
const initialPositionState = {
  x: 0,
  y: 0,
  z: 0,
  a: 0
};

// Create position slice
const positionSlice = createSlice({
  name: 'positionState',
  initialState: initialPositionState,
  reducers: {
    setPosition: (state, action) => {
        //console.log("setPosition");
        //console.log(action.payload);
        state.x = action.payload.x;
        state.y = action.payload.y;
        state.z = action.payload.z;
        state.a = action.payload.a;
      },
  },
});

// Export actions from position slice
export const { setPosition } = positionSlice.actions;

// Selector helper
export const getPositionState = (state) => state.position;



// Export reducer from position slice
export default positionSlice.reducer;

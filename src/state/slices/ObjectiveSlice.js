import { createSlice } from "@reduxjs/toolkit";


// Define the initial state
const initialObjectiveState = {
  fovX: 10,
  fovY: 10,
};

// Create slice
const objectiveSlice = createSlice({
  name: "objectiveState",
  initialState: initialObjectiveState,
  reducers: {
    setFovX: (state, action) => {
      console.log("setFovX", action.payload);
      state.fovX = action.payload;
    },
    setFovY: (state, action) => {
      console.log("setFovY", action.payload);
      state.fovY = action.payload;
    },

    resetState: (state) => {
      console.log("resetState");
      return { ...initialObjectiveState }; // Reset to initial state
    },
  },
});

// Export actions from slice
export const { setFovX, setFovY, resetState } = objectiveSlice.actions;

// Selector helper
export const getObjectiveState = (state) => state.objectiveState;

// Export reducer from slice
export default objectiveSlice.reducer;

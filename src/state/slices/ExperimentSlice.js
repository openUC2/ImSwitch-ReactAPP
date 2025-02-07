import { createSlice } from '@reduxjs/toolkit';

// Define the initial state  
const initialExperimentState = {
    name: "experiment",
    pointList: [],
    wellLayout: {
        unit: "um",
        width: 1000000,
        height: 600000,
        wells: [
          { x: 200000, y: 200000, shape: "circle", radius: 50000 },
          { x: 400000, y: 200000, shape: "circle", radius: 90000 },
          { x: 600000, y: 200000, shape: "circle", radius: 90000 },
          { x: 800000, y: 200000, shape: "circle", radius: 90000 },
          { x: 200000, y: 400000, shape: "circle", radius: 90000 },
          { x: 400000, y: 400000, shape: "circle", radius: 90000 },
          { x: 600000, y: 400000, shape: "rectangle", width: 90000, height: 180000, },
          { x: 800000, y: 400000, shape: "rectangle", width: 180000, height: 180000, },
        ],
      }
};

 

// Create slice
const experimentSlice = createSlice({
  name: 'experimentState',
  initialState: initialExperimentState,
  reducers: {
    addPoint: (state, action) => {
        console.log("addPoint")
        state.pointList.push(action.payload); 
    },
    removePoint: (state, action) => {
        console.log("removePoint")
        //return state.filter(point => point.id !== action.payload);
        state.pointList.splice(action.payload, 1);
    },
    setPointList: (state, action) => {
        console.log("setPointList")
        state.pointList = action.payload;
    },
    replacePoint: (state, action) => {
        console.log("replacePoint", action.payload)
        const { index, newPoint } = action.payload; 
        if (index >= 0 && index < state.pointList.length) { 
            state.pointList[index] = newPoint;
        }
    },
 
    resetState: (state) => {
        console.log("resetState");
        return initialExperimentState; // Reset to initial state
    }
  },
});

// Export actions from slice
export const { 
    addPoint, 
    removePoint, 
    setPointList, 
    replacePoint
} = experimentSlice.actions;

// Selector helper
export const getExperimentState = (state) => state.experimentState;

// Export reducer from slice
export default experimentSlice.reducer;

import apiObjectiveControllerGetStatus from "../backendapi/apiObjectiveControllerGetStatus.js";

import * as objectiveSlice from "../state/slices/ObjectiveSlice.js";

const fetchObjectiveControllerGetStatus = (dispatch) => {
  // Request to fetch objective status
  apiObjectiveControllerGetStatus()
    .then((data) => {
      console.log("fetchObjectiveControllerGetStatus", data);

      // Update Redux with the fetched status
      dispatch(objectiveSlice.setFovX(data.FOV[0]*1)); //* 1000)); //TODO remove fov dummy data correction factor
      dispatch(objectiveSlice.setFovY(data.FOV[1]*1));// * 1000)); //TODO remove fov dummy data correction factor

      //TODO check if field exists
      dispatch(objectiveSlice.setPosX1(data.x1));
      dispatch(objectiveSlice.setPosX2(data.x2)); 
      dispatch(objectiveSlice.setPixelSize(data.pixelsize)); 
      dispatch(objectiveSlice.setPosZ1(data.z1));
      dispatch(objectiveSlice.setPosZ2(data.z2));
  
      //TODO add more objective results
      /*reposne: 
      {
        "x1": 0,
        "x2": 0,
        "pos": 0,
        "isHomed": 0,
        "state": 0,
        "isRunning": 0,
        "FOV": [
            100,
            100
        ],
        "pixelsize": 0.2
      }
      */
    })
    .catch((err) => {
      console.error("Failed to fetch objective status", err);
    });
};

export default fetchObjectiveControllerGetStatus;

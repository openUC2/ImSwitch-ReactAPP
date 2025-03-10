import * as parameterRangeSlice from "../state/slices/ParameterRangeSlice.js";

import apiGetCurrentExperimentParams from "../backendapi/apiExperimentControllerGetCurrentExperimentParams.js";


const fetchExperimentControllerGetCurrentExperimentParams = (dispatch) => {
    //request
  apiGetCurrentExperimentParams()
    .then((data) => {
      console.log("fetchExperimentControllerGetCurrentExperimentParams", data);


      //update redux states 

      dispatch(parameterRangeSlice.setIllumination(data.illuminationSources));
      dispatch(parameterRangeSlice.setLaserWaveLength(data.laserWavelengths));

      dispatch(parameterRangeSlice.setTimeLapsePeriodMin(data.timeLapsePeriodMin));
      dispatch(parameterRangeSlice.setTimeLapsePeriodMax(data.timeLapsePeriodMax));

      dispatch(parameterRangeSlice.setNumberOfImagesMin(data.numberOfImagesMin));
      dispatch(parameterRangeSlice.setNumberOfImagesMax(data.numberOfImagesMax));

      dispatch(parameterRangeSlice.setAutoFocusMin(data.autofocusMinFocusPosition));
      dispatch(parameterRangeSlice.setAutoFocusMax(data.autofocusMaxFocusPosition));

      dispatch(parameterRangeSlice.setAutoFocusStepSizeMin(data.autofocusStepSizeMin));
      dispatch(parameterRangeSlice.setAutoFocusStepSizeMax(data.autofocusStepSizeMax));

      dispatch(parameterRangeSlice.setZStackMin(data.zStackMinFocusPosition));
      dispatch(parameterRangeSlice.setZStackMax(data.zStackMaxFocusPosition));

      dispatch(parameterRangeSlice.setZStackStepSizeMin(data.zStackStepSizeMin));
      dispatch(parameterRangeSlice.setZStackStepSizeMax(data.zStackStepSizeMax));

      dispatch(parameterRangeSlice.setSpeed([1, 5, 10, 50, 100, 500, 1000, 10000, 20000, 100000])); // TODO: Should come from backend
    
    })
    .catch((err) => {
      console.error("Failed to fetch experiment parameters", err);
    });
};

export default fetchExperimentControllerGetCurrentExperimentParams;

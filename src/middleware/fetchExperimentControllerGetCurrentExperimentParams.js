import * as hardwareSlice from "../state/slices/HardwareSlice.js";

import apiGetCurrentExperimentParams from "../backendapi/apiExperimentControllerGetCurrentExperimentParams.js";


const fetchExperimentControllerGetCurrentExperimentParams = (dispatch) => {
    //request
  apiGetCurrentExperimentParams()
    .then((data) => {
      console.log("fetchExperimentControllerGetCurrentExperimentParams", data);

      // Parse the data
      const updatedParameterRange = {
        illumination: data.illuminationSources,
        laserWaveLength: data.laserWavelengths,
        timeLapsePeriod: {
          min: data.timeLapsePeriodMin,
          max: data.timeLapsePeriodMax
        },
        numberOfImages: {
          min: data.numberOfImagesMin,
          max: data.numberOfImagesMax
        },
        autoFocus: {
          min: data.autofocusMinFocusPosition,
          max: data.autofocusMaxFocusPosition
        },
        autoFocusStepSize: {
          min: data.autofocusStepSizeMin,
          max: data.autofocusStepSizeMax
        },
        zStack: {
          min: data.zStackMinFocusPosition,
          max: data.zStackMaxFocusPosition
        },
        zStackStepSize: {
          min: data.zStackStepSizeMin,
          max: data.zStackStepSizeMax
        }
      };

      // Update Redux
      dispatch(hardwareSlice.setParamaeterRange(updatedParameterRange));
    })
    .catch((err) => {
      console.error("Failed to fetch experiment parameters", err);
    });
};

export default fetchExperimentControllerGetCurrentExperimentParams;

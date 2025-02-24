// src/api/apiStopExperiment.js
import createAxiosInstance from "../backendapi/createAxiosInstance";

const apiStopExperiment = async () => {
  try {
    const axiosInstance = createAxiosInstance(); // Create Axios instance
    const response = await axiosInstance.get("/ExperimentController/stopExperiment"); // Send GET request
    return response.data; // Return the data from the response
  } catch (error) {
    console.error("Error stopping experiment:", error);
    throw error; // Throw error to be handled by the caller
  }
};

export default apiStopExperiment;

/*
// Example usage:

const stopExperiment = () => {
  apiStopExperiment()
    .then((data) => {
      setExperimentStatus(data); // Handle success response
    })
    .catch((err) => {
      setError("Failed to stop experiment"); // Handle the error
    });
};
*/

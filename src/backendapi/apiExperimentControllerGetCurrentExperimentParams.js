// src/api/apiExperimentControllerGetCurrentExperimentParams.js
import createAxiosInstance from "./createAxiosInstance";

const apiExperimentControllerGetCurrentExperimentParams = async () => {
  try {
    const axiosInstance = createAxiosInstance(); // Create Axios instance
    const response = await axiosInstance.get("/ExperimentController/getCurrentExperimentParameters"); // Send GET request
    return response.data; // Return the data from the response
  } catch (error) {
    console.error("Error fetching experiment parameters:", error);
    throw error; // Throw error to be handled by the caller
  }
};

export default apiExperimentControllerGetCurrentExperimentParams;

/*
// Example usage:

const fetchExperimentParams = () => {
  apiExperimentControllerGetCurrentExperimentParams()
    .then((data) => {
      setExperimentParams(data); // Set the experiment parameters after the data is fetched
    })
    .catch((err) => {
      setError("Failed to fetch experiment parameters"); // Handle the error
    });
};
*/

// src/api/apiGetExperimentStatus.js
import createAxiosInstance from "../backendapi/createAxiosInstance";

const apiGetExperimentStatus = async () => {
  try {
    const axiosInstance = createAxiosInstance(); // Create Axios instance
    const response = await axiosInstance.get("/ExperimentController/getExperimentStatus"); // Send GET request
    return response.data; // Return the data from the response
  } catch (error) {
    console.error("Error fetching experiment status:", error);
    throw error; // Throw error to be handled by the caller
  }
};

export default apiGetExperimentStatus;

/*
// Example usage:

const fetchExperimentStatus = () => {
  apiGetExperimentStatus()
    .then((data) => {
      setExperimentStatus(data); // Handle success response
    })
    .catch((err) => {
      setError("Failed to fetch experiment status"); // Handle the error
    });
};
*/

// src/api/apiResumeExperiment.js
import createAxiosInstance from "../backendapi/createAxiosInstance";

const apiResumeExperiment = async () => {
  try {
    const axiosInstance = createAxiosInstance(); // Create Axios instance
    const response = await axiosInstance.get("/ExperimentController/resumeExperiment"); // Send GET request
    return response.data; // Return the data from the response
  } catch (error) {
    console.error("Error resuming experiment:", error);
    throw error; // Throw error to be handled by the caller
  }
};

export default apiResumeExperiment;

/*
// Example usage:

const resumeExperiment = () => {
  apiResumeExperiment()
    .then((data) => {
      setExperimentStatus(data); // Handle success response
    })
    .catch((err) => {
      setError("Failed to resume experiment"); // Handle the error
    });
};
*/

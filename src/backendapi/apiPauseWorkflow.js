// src/api/apiPauseWorkflow.js
import createAxiosInstance from "../backendapi/createAxiosInstance";

const apiPauseWorkflow = async () => {
  try {
    const axiosInstance = createAxiosInstance(); // Create Axios instance
    const response = await axiosInstance.get("/ExperimentController/pauseWorkflow"); // Send GET request
    return response.data; // Return the data from the response
  } catch (error) {
    console.error("Error pausing workflow:", error);
    throw error; // Throw error to be handled by the caller
  }
};

export default apiPauseWorkflow;

/*
// Example usage:

const pauseWorkflow = () => {
  apiPauseWorkflow()
    .then((data) => {
      setWorkflowStatus(data); // Handle success response
    })
    .catch((err) => {
      setError("Failed to pause workflow"); // Handle the error
    });
};
*/

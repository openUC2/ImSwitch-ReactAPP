// src/api/apiExperimentControllerStartWorkflow.js
import createAxiosInstance from "./createAxiosInstance";

const apiExperimentControllerStartWorkflow = async () => {
  try {
    const axiosInstance = createAxiosInstance(); // Create Axios instance
    const response = await axiosInstance.get("/ExperimentController/startWorkflow"); // Send GET request
    return response.data; // Return the data from the response
  } catch (error) {
    console.error("Error starting workflow:", error);
    throw error; // Throw error to be handled by the caller
  }
};

export default apiExperimentControllerStartWorkflow;

/*
// Example usage:

const startWorkflow = () => {
  apiExperimentControllerStartWorkflow()
    .then((data) => {
      setWorkflowStatus(data); // Handle success response
    })
    .catch((err) => {
      setError("Failed to start workflow"); // Handle the error
    });
};
*/
// src/api/apiHistoScanControllerGetSampleLayoutFilePaths.js
import createAxiosInstance from "./createAxiosInstance";

const apiHistoScanControllerGetSampleLayoutFilePaths = async () => {
  try {
    const axiosInstance = createAxiosInstance(); // Create Axios instance
    const response = await axiosInstance.get("/HistoScanController/getSampleLayoutFilePaths"); // Send GET request to the new endpoint
    return response.data; // Return the data from the response
  } catch (error) {
    console.error("Error fetching sample layout file paths:", error);
    throw error; // Throw error to be handled by the caller
  }
};

export default apiHistoScanControllerGetSampleLayoutFilePaths;

/*
// Example usage:

const fetchSampleLayoutFilePaths = () => {
  apiHistoScanControllerGetSampleLayoutFilePaths()
    .then((data) => {
      setSampleLayoutFilePaths(data); // Handle success response
    })
    .catch((err) => {
      setError("Failed to fetch sample layout file paths"); // Handle the error
    });
};
*/

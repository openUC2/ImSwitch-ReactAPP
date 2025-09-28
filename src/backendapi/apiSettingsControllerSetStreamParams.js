// src/backendapi/apiSettingsControllerSetStreamParams.js
import createAxiosInstance from "./createAxiosInstance";

const apiSettingsControllerSetStreamParams = async (params = {}) => {
  try {
    const axiosInstance = createAxiosInstance(); // Create Axios instance
    
    // Build query parameters if provided
    const queryParams = new URLSearchParams();
    if (params.throttle_ms !== undefined) {
      queryParams.append('throttle_ms', params.throttle_ms);
    }
    
    // Prepare request body for compression and subsampling
    const requestBody = {};
    if (params.compression !== undefined) {
      requestBody.compression = params.compression;
    }
    if (params.subsampling !== undefined) {
      requestBody.subsampling = params.subsampling;
    }
    
    const url = `/SettingsController/setStreamParams${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    // Send POST request with JSON body
    const response = await axiosInstance.get(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    return response.data; // Return the data from the response
  } catch (error) {
    console.error("Error setting stream parameters:", error);
    throw error; // Throw error to be handled by the caller
  }
};

export default apiSettingsControllerSetStreamParams;

/*
// Example usage:

const setStreamParams = async () => {
  try {
    const result = await apiSettingsControllerSetStreamParams({
      throttle_ms: 50,
      compression: {
        algorithm: "lz4",
        level: 0
      },
      subsampling: {
        factor: 2,
        auto_max_dim: 1024
      }
    });
    console.log("Stream parameters updated:", result);
  } catch (err) {
    console.error("Failed to set stream parameters:", err);
  }
};
*/
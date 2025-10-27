// src/backendapi/apiAutofocusControllerStartLiveMonitoring.js
import createAxiosInstance from "./createAxiosInstance";

/**
 * Start live autofocus monitoring mode
 * @param {number} period - Update period in seconds (default 0.5s)
 * @param {string} method - Focus measurement method ("LAPE" or "GLVA")
 * @returns {Promise<Object>} Response containing status and configuration
 */
const apiAutofocusControllerStartLiveMonitoring = async (period = 0.5, method = "LAPE") => {
  try {
    const axiosInstance = createAxiosInstance();
    
    const response = await axiosInstance.get("/AutofocusController/startLiveMonitoring", {
      params: {
        period,
        method
      }
    });
    
    return response.data;
  } catch (error) {
    console.error("Failed to start live autofocus monitoring:", error);
    throw error;
  }
};

export default apiAutofocusControllerStartLiveMonitoring;

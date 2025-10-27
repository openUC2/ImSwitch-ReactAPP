// src/backendapi/apiAutofocusControllerSetLiveMonitoringParameters.js
import createAxiosInstance from "./createAxiosInstance";

/**
 * Update live monitoring parameters
 * @param {number|null} period - Update period in seconds (optional)
 * @param {string|null} method - Focus measurement method ("LAPE" or "GLVA") (optional)
 * @returns {Promise<Object>} Response containing updated configuration
 */
const apiAutofocusControllerSetLiveMonitoringParameters = async (period = null, method = null) => {
  try {
    const axiosInstance = createAxiosInstance();
    
    const params = {};
    if (period !== null) params.period = period;
    if (method !== null) params.method = method;
    
    const response = await axiosInstance.get("/AutofocusController/setLiveMonitoringParameters", {
      params
    });
    
    return response.data;
  } catch (error) {
    console.error("Failed to set live monitoring parameters:", error);
    throw error;
  }
};

export default apiAutofocusControllerSetLiveMonitoringParameters;

import createAxiosInstance from "./createAxiosInstance.js";

const apiFocusLockControllerSetParamsAstigmatism = async ({ gaussianSigma, backgroundThreshold, cropSize, cropCenter }) => {
  try {
    const axiosInstance = createAxiosInstance();
    const config = {
      params: { gaussianSigma, backgroundThreshold, cropSize }
    };
    
    // Add cropCenter as request body if provided
    if (cropCenter) {
      config.data = cropCenter;
      config.headers = {
        'Content-Type': 'application/json'
      };
    }
    
    const response = await axiosInstance.get('/FocusLockController/setParamsAstigmatism', config);
    return response.data;
  } catch (error) {
    console.error("Error setting astigmatism parameters:", error);
    throw error;
  }
};

export default apiFocusLockControllerSetParamsAstigmatism;
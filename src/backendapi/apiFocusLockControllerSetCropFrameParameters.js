import createAxiosInstance from "./createAxiosInstance.js";

const apiFocusLockControllerSetCropFrameParameters = async ({ cropSize, cropCenter }) => {
  try {
    const axiosInstance = createAxiosInstance();
    const config = {
      params: { cropSize }
    };
    
    // Add cropCenter as request body if provided
    if (cropCenter) {
      config.data = cropCenter;
      config.headers = {
        'Content-Type': 'application/json'
      };
    }
    
    const response = await axiosInstance.get('/FocusLockController/setCropFrameParameters', config);
    return response.data;
  } catch (error) {
    console.error("Error setting crop frame parameters:", error);
    throw error;
  }
};

export default apiFocusLockControllerSetCropFrameParameters;
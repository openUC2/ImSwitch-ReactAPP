import createAxiosInstance from "./createAxiosInstance.js";

const apiFocusLockControllerSetCropFrameParameters = async ({ cropSize, cropCenter }) => {
  try {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get('/FocusLockController/setCropFrameParameters', {
      params: { cropSize },
      data: cropCenter
    });
    return response.data;
  } catch (error) {
    console.error("Error setting crop frame parameters:", error);
    throw error;
  }
};

export default apiFocusLockControllerSetCropFrameParameters;
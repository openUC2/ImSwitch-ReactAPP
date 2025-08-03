import createAxiosInstance from "./createAxiosInstance.js";

const apiFocusLockControllerSetParamsAstigmatism = async ({ gaussianSigma, backgroundThreshold, cropSize, cropCenter }) => {
  try {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get('/FocusLockController/setParamsAstigmatism', {
      params: { gaussianSigma, backgroundThreshold, cropSize },
      data: cropCenter
    });
    return response.data;
  } catch (error) {
    console.error("Error setting astigmatism parameters:", error);
    throw error;
  }
};

export default apiFocusLockControllerSetParamsAstigmatism;
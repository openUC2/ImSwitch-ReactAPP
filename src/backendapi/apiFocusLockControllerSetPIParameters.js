import createAxiosInstance from "./createAxiosInstance.js";

const apiFocusLockControllerSetPIParameters = async ({ multiplier, kp, ki }) => {
  try {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get('/FocusLockController/setPIParameters', {
      params: { multiplier, kp, ki }
    });
    return response.data;
  } catch (error) {
    console.error("Error setting PI parameters:", error);
    throw error;
  }
};

export default apiFocusLockControllerSetPIParameters;
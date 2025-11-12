// src/backendapi/apiUC2ConfigControllerStartMultipleDeviceOTA.js
import createAxiosInstance from "./createAxiosInstance";

const apiUC2ConfigControllerStartMultipleDeviceOTA = async (canIds, ssid = null, password = null, timeout = 300000, delayBetween = 2) => {
  try {
    const axiosInstance = createAxiosInstance();
    const payload = { can_ids: canIds, timeout, delay_between: delayBetween };
    if (ssid) payload.ssid = ssid;
    if (password) payload.password = password;
    
    const response = await axiosInstance.post("/UC2ConfigController/startMultipleDeviceOTA", payload);
    return response.data; // { status: "success", message: "...", results: [...] }
  } catch (error) {
    console.error("Error starting multiple device OTA:", error);
    throw error;
  }
};

export default apiUC2ConfigControllerStartMultipleDeviceOTA;

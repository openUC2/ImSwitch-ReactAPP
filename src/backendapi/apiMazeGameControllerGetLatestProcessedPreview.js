import createAxiosInstance from "./createAxiosInstance";

const apiMazeGameControllerGetLatestProcessedPreview = async () => {
  try {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get("/MazeGameController/getLatestProcessedPreview");
    return response.data;
  } catch (error) {
    console.error("Error fetching maze game preview:", error);
    throw error;
  }
};

export default apiMazeGameControllerGetLatestProcessedPreview;

// src/api/apiGethistostatus.js
import createAxiosInstance from "../backendapi/createAxiosInstance";

const apiGetHistoStatus = async () => {
  try {
    const axiosInstance = createAxiosInstance(); // Create Axios instance
    const response = await axiosInstance.get("/HistoScanController/getHistoStatus"); // Send GET request
    return response.data; // Return the data from the response
  } catch (error) {
    console.error("Error fetching histo status:", error);
    throw error; // Throw error to be handled by the caller
  }
};

export default apiGetHistoStatus;


/*
//Example usage:

const fetchHistoStatus = () => {
  apiGetHistoStatus()
    .then((data) => {
      setStatus(data); // Set the status after the data is fetched
    })
    .catch((err) => {
      setError("Failed to fetch histo status"); // Handle the error
    });
};

*/
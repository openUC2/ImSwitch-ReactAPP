import createAxiosInstance from "./createAxiosInstance";

// Function to move to a specific objective based on the slot
const apiObjectiveControllerMoveToObjective = async (slot) => {
  try {
    const axiosInstance = createAxiosInstance(); // Create Axios instance
    const response = await axiosInstance.get(`/ObjectiveController/moveToObjective?slot=${slot}`); // Send GET request with the slot parameter
    return response.data; // Return the data from the response
  } catch (error) {
    console.error(`Error moving to objective with slot ${slot}:`, error);
    throw error; // Throw error to be handled by the caller
  }
};

export default apiObjectiveControllerMoveToObjective;

/*
Example usage:

const moveToObjective = (slot) => {
  apiObjectiveControllerMoveToObjective(slot)
    .then((data) => {
      setMoveResult(data); // Handle success response
    })
    .catch((err) => {
      setError("Failed to move to the objective"); // Handle the error
    });
};
*/

import createAxiosInstance from "./createAxiosInstance";

// Function to set positions with optional parameters in an object
const apiObjectiveControllerSetPositions = async ({ x1, x2, isBlocking = false }) => {
  try {
    // Start the query string with the base URL
    let query = "/ObjectiveController/setPositions?";
    
    // Include x1 if it's provided
    if (x1 !== undefined) {
      query += `x1=${x1}&`;
    }
    
    // Include x2 if it's provided
    if (x2 !== undefined) {
      query += `x2=${x2}&`;
    }
    
    // Include isBlocking, defaulting to false if not provided
    query += `isBlocking=${isBlocking}`;

    const axiosInstance = createAxiosInstance(); // Create Axios instance
    const response = await axiosInstance.get(query); // Send GET request with the dynamic query string
    return response.data; // Return the data from the response
  } catch (error) {
    console.error("Error setting positions:", error);
    throw error; // Throw error to be handled by the caller
  }
};

export default apiObjectiveControllerSetPositions;

/*
Example usage:

const setPositions = (positionParams) => {
  apiObjectiveControllerSetPositions(positionParams)
    .then((data) => {
      setPositionResult(data); // Handle success response
    })
    .catch((err) => {
      setError("Failed to set positions"); // Handle the error
    });
};

// Example of calling the function
setPositions({ x1: 100, x2: 200, isBlocking: true });
setPositions({ x2: 200 });  // Only x2, isBlocking will be default false
setPositions({ isBlocking: true });  // Only isBlocking
setPositions({ x1: 100 });  // Only x1
*/

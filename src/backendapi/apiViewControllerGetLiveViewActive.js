// src/backendapi/apiViewControllerGetLiveViewActive.js
import createAxiosInstance from "./createAxiosInstance";

/**
 * Check if live view is currently active
 * GET /ViewController/getLiveViewActive
 * 
 * Returns: boolean (true if stream is active, false otherwise)
 */
const apiViewControllerGetLiveViewActive = async () => {
  try {
    const axiosInstance = createAxiosInstance();
    const url = `/ViewController/getLiveViewActive`;
    const response = await axiosInstance.get(url);
    
    // Backend might return different formats, handle them
    if (typeof response.data === 'boolean') {
      return response.data;
    }
    if (typeof response.data === 'object' && response.data !== null) {
      return response.data.active || response.data.isActive || false;
    }
    return false;
  } catch (error) {
    console.warn('Failed to get live view active status:', error.message);
    return false;
  }
};

export default apiViewControllerGetLiveViewActive;

/**
 * Example usage:
 * const isActive = await apiViewControllerGetLiveViewActive();
 * console.log('Stream is active:', isActive);
 */

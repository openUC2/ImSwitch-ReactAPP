// src/backendapi/apiLiveViewControllerGetStreamParameters.js
import createAxiosInstance from "./createAxiosInstance";

/**
 * Get current streaming parameters
 * GET /LiveViewController/getStreamParameters
 * 
 * @param {string|null} protocol - Optional protocol to get params for (null = all protocols)
 *                                 Valid values: 'binary', 'jpeg', 'mjpeg', 'webrtc'
 * 
 * Returns: Dictionary with streaming parameters
 * Example response (all protocols):
 * {
 *   "binary": {
 *     "compression_algorithm": "lz4",
 *     "compression_level": 0,
 *     "subsampling_factor": 4,
 *     "throttle_ms": 50
 *   },
 *   "jpeg": {
 *     "jpeg_quality": 80,
 *     "subsampling_factor": 4,
 *     "throttle_ms": 50
 *   }
 * }
 */
const apiLiveViewControllerGetStreamParameters = async (protocol = null) => {
  try {
    const axiosInstance = createAxiosInstance();
    const url = `/LiveViewController/getStreamParameters`;
    
    const params = {};
    if (protocol !== null && protocol !== undefined) {
      params.protocol = protocol;
    }
    
    const response = await axiosInstance.get(url, { params });
    return response.data;
  } catch (error) {
    console.error('Error getting stream parameters:', error);
    throw error;
  }
};

export default apiLiveViewControllerGetStreamParameters;

/**
 * Example usage:
 * // Get all protocols
 * const allParams = await apiLiveViewControllerGetStreamParameters();
 * 
 * // Get specific protocol
 * const binaryParams = await apiLiveViewControllerGetStreamParameters('binary');
 * const jpegParams = await apiLiveViewControllerGetStreamParameters('jpeg');
 */

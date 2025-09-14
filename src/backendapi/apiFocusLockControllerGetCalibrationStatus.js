// Fetches calibration status from backend
export default async function apiFocusLockControllerGetCalibrationStatus() {
  const url = 'https://localhost:8001/FocusLockController/getCalibrationStatus';
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'accept': 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to get calibration status');
  }
  return await response.json();
}

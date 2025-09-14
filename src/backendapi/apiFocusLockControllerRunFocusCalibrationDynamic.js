// Sends a POST request to run dynamic focus calibration with parameters
// scan_range_um, num_steps, settle_time
export default async function apiFocusLockControllerRunFocusCalibrationDynamic({ scan_range_um = 2000, num_steps = 20, settle_time = 0.5 } = {}) {
  const url = `https://localhost:8001/FocusLockController/runFocusCalibrationDynamic?scan_range_um=${scan_range_um}&num_steps=${num_steps}&settle_time=${settle_time}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'accept': 'application/json'
    },
    body: ''
  });
  if (!response.ok) {
    throw new Error('Failed to start dynamic focus calibration');
  }
  return await response.json();
}

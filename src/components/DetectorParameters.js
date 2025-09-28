import React, { useState, useEffect } from "react";
import {
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Typography,
} from "@mui/material";

/**
 * This component fetches and updates the detector parameters from:
 *    /SettingsController/getDetectorParameters
 *
 * It calls the known endpoints to update each parameter individually:
 *    setDetectorExposureTime?exposureTime=...
 *    setDetectorGain?gain=...
 *    setDetectorBinning?binning=...
 *    setDetectorBlackLevel?blacklevel=...
 *    setDetectorIsRGB?isRGB=...
 *    setDetectorMode?isAuto=...
 * (Adapt or expand if your API uses a different pattern.)
 *
 * Usage:
 *   <DetectorParameters hostIP={hostIP} hostPort={hostPort} />
 */
export default function DetectorParameters({ hostIP, hostPort }) {
  const [detectorParams, setDetectorParams] = useState({
    exposure: "",
    gain: "",
    pixelSize: "",
    binning: "",
    blacklevel: "",
    isRGB: false,
    mode: "manual",
  });

  // Fetch existing detector parameters once on mount
  useEffect(() => {
    async function fetchParams() {
      try {
        const resp = await fetch(`${hostIP}:${hostPort}/SettingsController/getDetectorParameters`);
        if (resp.ok) {
          const data = await resp.json();
          setDetectorParams({
            exposure: data.exposure ?? "",
            gain: data.gain ?? "",
            pixelSize: data.pixelSize ?? "",
            binning: data.binning ?? "",
            blacklevel: data.blacklevel ?? "",
            isRGB: data.isRGB === 1, // Convert 0/1 to boolean
            mode: (data.mode ?? "manual").toLowerCase(), // Normalize to lowercase to match MenuItem values
          });
        }
      } catch (error) {
        console.error("Error fetching detector parameters:", error);
      }
    }
    fetchParams();
  }, [hostIP, hostPort]);

  // Update both local state and the actual backend
  const handleParamChange = async (field, value) => {
    setDetectorParams((prev) => ({ ...prev, [field]: value }));

    try {
      switch (field) {
        case "exposure":
          await fetch(`${hostIP}:${hostPort}/SettingsController/setDetectorExposureTime?exposureTime=${value}`);
          break;
        case "gain":
          await fetch(`${hostIP}:${hostPort}/SettingsController/setDetectorGain?gain=${value}`);
          break;
        case "binning":
          await fetch(`${hostIP}:${hostPort}/SettingsController/setDetectorBinning?binning=${value}`);
          break;
        case "blacklevel":
          await fetch(`${hostIP}:${hostPort}/SettingsController/setDetectorBlackLevel?blacklevel=${value}`);
          break;
        case "isRGB": {
          const intVal = value ? 1 : 0;
          await fetch(`${hostIP}:${hostPort}/SettingsController/setDetectorIsRGB?isRGB=${intVal}`);
          break;
        }
        case "mode": {
          // If the API expects e.g. `isAuto=true` for "auto" mode:
          const isAuto = value === "auto";
          await fetch(`${hostIP}:${hostPort}/SettingsController/setDetectorMode?isAuto=${isAuto}`);
          break;
        }
        // pixelSize may or may not have its own setter in your API
        // Add that here if needed.
        default:
          break;
      }
    } catch (error) {
      console.error(`Error updating '${field}' to '${value}':`, error);
    }
  };

  return (
    <Box>
      <Typography variant="h6">Detector Parameters</Typography>

      <TextField
        label="Exposure"
        type="number"
        value={detectorParams.exposure}
        onChange={(e) => handleParamChange("exposure", e.target.value)}
        size="small"
        margin="dense"
      />
      <TextField
        label="Gain"
        type="number"
        value={detectorParams.gain}
        onChange={(e) => handleParamChange("gain", e.target.value)}
        size="small"
        margin="dense"
      />
      
      <TextField
        label="Black Level"
        type="number"
        value={detectorParams.blacklevel}
        onChange={(e) => handleParamChange("blacklevel", e.target.value)}
        size="small"
        margin="dense"
      />
      <TextField
        select
        label="Mode"
        value={detectorParams.mode}
        onChange={(e) => handleParamChange("mode", e.target.value)}
        size="small"
        margin="dense"
        sx={{ width: 120 }}
      >
        <MenuItem value="manual">Manual</MenuItem>
        <MenuItem value="auto">Auto</MenuItem>
      </TextField>
      <TextField
        label="Pixel Size"
        type="number"
        value={detectorParams.pixelSize}
        size="small"
        margin="dense"
      />
    </Box>
  );
}

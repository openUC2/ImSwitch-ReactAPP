import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getConnectionSettingsState } from "../state/slices/ConnectionSettingsSlice";
import {
  Box,
  Typography,
  Button,
  Switch,
  FormControlLabel,
} from "@mui/material";

export default function SystemSettings() {
  // Get connection settings from Redux
  const { ip: hostIP, apiPort: hostPort } = useSelector(
    getConnectionSettingsState
  );
  // safety toggles
  const [enableImSwitch, setEnableImSwitch] = useState(false);
  const [enableRaspi, setEnableRaspi] = useState(false);
  const [isImSwitchRunning, setIsImSwitchRunning] = useState(false);
  const [diskUsage, setDiskUsage] = useState(null);

  const base = `${hostIP}:${hostPort}`;

  const callEndpoint = async (url) => {
    try {
      await fetch(url, { method: "POST" });
    } catch (e) {
      console.error(e);
    }
  };

  // Poll every 5 seconds to check if ImSwitch is running
  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`${base}/isImSwitchRunning`);
        // We assume the endpoint returns JSON like { running: true }
        const data = await res.json();
        setIsImSwitchRunning(data.running);
      } catch (error) {
        console.error(error);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [base]);

  // Periodically fetch disk usage when component mounts
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchDiskUsage();
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  // Fetches the disk usage from the server
  const fetchDiskUsage = async () => {
    try {
      const response = await fetch(`${base}/getDiskUsage`);
      if (response.ok) {
        const data = await response.json();
        setDiskUsage(data.usage); // e.g. "75%"
      } else {
        console.error("Failed to fetch disk usage");
      }
    } catch (error) {
      console.error("Error fetching disk usage:", error);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        System Settings
      </Typography>

      {/* restart / stop ImSwitch */}
      <Box mb={3}>
        <FormControlLabel
          control={
            <Switch
              checked={enableImSwitch}
              onChange={(e) => setEnableImSwitch(e.target.checked)}
            />
          }
          label="Enable ImSwitch control"
        />

        <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
          <Button
            variant="contained"
            disabled={!enableImSwitch}
            onClick={() => callEndpoint(`${base}/restartImSwitch`)}
          >
            Restart ImSwitch
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            disabled={!enableImSwitch}
            onClick={() => callEndpoint(`${base}/stopImSwitch`)}
          >
            Stop ImSwitch
          </Button>
        </Box>
      </Box>

      {/* restart Raspberry Pi */}
      <Box>
        <FormControlLabel
          control={
            <Switch
              checked={enableRaspi}
              onChange={(e) => setEnableRaspi(e.target.checked)}
            />
          }
          label="Enable Raspberry Pi reboot"
        />

        <Box sx={{ mt: 1 }}>
          <Button
            variant="contained"
            color="error"
            disabled={!enableRaspi}
            onClick={() => callEndpoint(`${base}/restartRaspi`)}
          >
            Reboot Raspberry Pi
          </Button>
        </Box>

        <Box sx={{ mt: 1 }}>
          <Button
            variant="outlined"
            color="error"
            disabled={!enableRaspi}
            onClick={() => callEndpoint(`${base}/shutdownRaspi`)}
          >
            Shutdown Raspberry Pi
          </Button>
        </Box>
      </Box>
      <Box mb={2}>
        {/* Display the current ImSwitch running status */}
        <Typography variant="body1">
          ImSwitch is {isImSwitchRunning ? "running" : "not running"}
        </Typography>
      </Box>
      <Box mb={2}>
        <Typography variant="body1">
          Disk usage: {diskUsage ?? "Loading..."}
        </Typography>
      </Box>
    </Box>
  );
}

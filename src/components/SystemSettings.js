import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getConnectionSettingsState } from "../state/slices/ConnectionSettingsSlice";
import * as uc2Slice from "../state/slices/UC2Slice.js";
import {
  Box,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Alert,
  Chip,
  LinearProgress,
} from "@mui/material";
import {
  Computer,
  Storage,
  Warning,
  CheckCircle,
  ErrorOutline,
} from "@mui/icons-material";

export default function SystemSettings() {
  // Get connection settings from Redux - following Copilot Instructions
  const { ip: hostIP, apiPort: hostPort } = useSelector(
    getConnectionSettingsState
  );

  // Get backend connection status
  const uc2State = useSelector(uc2Slice.getUc2State);
  const isBackendConnected = uc2State.uc2Connected;

  // Safety toggles
  const [enableImSwitch, setEnableImSwitch] = useState(false);
  const [enableRaspi, setEnableRaspi] = useState(false);
  const [isImSwitchRunning, setIsImSwitchRunning] = useState(false);
  const [diskUsage, setDiskUsage] = useState(null);

  const base = `${hostIP}:${hostPort}/UC2ConfigController`;

  // API communication following Copilot Instructions
  const callEndpoint = async (url) => {
    try {
      const response = await fetch(url, { method: "POST" });
      if (!response.ok) {
        console.error(
          `API call failed: ${response.status} ${response.statusText}`
        );
      }
    } catch (e) {
      console.error("API call error:", e);
    }
  };

  // Poll every 10 seconds to check if ImSwitch is running (less frequent)
  useEffect(() => {
    // Only poll if backend is connected
    if (!isBackendConnected) {
      setIsImSwitchRunning(false);
      return;
    }

    const checkImSwitchStatus = async () => {
      try {
        const res = await fetch(`${base}/isImSwitchRunning`);
        if (res.ok) {
          const data = await res.json();
          console.log("Full ImSwitch status response:", data);

          // Handle the actual API response format - direct boolean
          let isRunning;
          if (typeof data === "boolean") {
            // API returns direct boolean (true/false)
            isRunning = data;
          } else if (data && typeof data === "object") {
            // Fallback: check for various possible property names
            isRunning = data.running || data.isRunning || data.status || false;
          } else {
            isRunning = false;
          }

          setIsImSwitchRunning(isRunning);
          console.log("Processed ImSwitch status:", isRunning);
        }
      } catch (error) {
        console.error("Error checking ImSwitch status:", error);
        setIsImSwitchRunning(false);
      }
    };

    // Initial check
    checkImSwitchStatus();

    const intervalId = setInterval(checkImSwitchStatus, 10000);
    return () => clearInterval(intervalId);
  }, [base, isBackendConnected]);

  // Fetch disk usage - fixed to handle the actual API response format
  useEffect(() => {
    // Only fetch if backend is connected
    if (!isBackendConnected) {
      setDiskUsage(null);
      return;
    }

    const fetchDiskUsage = async () => {
      try {
        const response = await fetch(`${base}/getDiskUsage`);
        if (response.ok) {
          const data = await response.json();
          console.log("Full disk usage response:", data);

          // Handle the actual API response format - direct number
          let usage;
          if (typeof data === "number") {
            // Convert decimal to percentage (0.686940516168836 -> 68.69%)
            usage = `${(data * 100).toFixed(1)}%`;
          } else if (typeof data === "string") {
            // If it's already a string, use it directly
            usage = data;
          } else if (data && typeof data === "object") {
            // Fallback: check for various possible property names
            usage =
              data.usage ||
              data.disk_usage ||
              data.diskUsage ||
              data.percentage ||
              "Unknown format";
          } else {
            usage = "Unknown format";
          }

          setDiskUsage(usage);
          console.log("Processed disk usage:", usage);
        } else {
          console.error("Failed to fetch disk usage:", response.status);
          setDiskUsage("Error loading");
        }
      } catch (error) {
        console.error("Error fetching disk usage:", error);
        setDiskUsage("Error loading");
      }
    };

    // Initial fetch
    fetchDiskUsage();

    // Fetch every 30 seconds (less frequent for disk usage)
    const intervalId = setInterval(fetchDiskUsage, 30000);
    return () => clearInterval(intervalId);
  }, [base, isBackendConnected]);

  // Helper function to get disk usage color based on percentage
  const getDiskUsageColor = (usage) => {
    if (!usage || usage === "Loading..." || usage.includes("Error"))
      return "default";
    const percentage = parseFloat(usage.replace("%", ""));
    if (percentage > 90) return "error";
    if (percentage > 75) return "warning";
    return "success";
  };

  // Helper function to get disk usage severity
  const getDiskUsageSeverity = (usage) => {
    if (!usage || usage === "Loading..." || usage.includes("Error"))
      return "info";
    const percentage = parseFloat(usage.replace("%", ""));
    if (percentage > 90) return "error";
    if (percentage > 75) return "warning";
    return "success";
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          System Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Control ImSwitch services and system operations
        </Typography>
      </Box>

      {/* Backend Connection Status */}
      <Alert
        severity={isBackendConnected ? "success" : "error"}
        sx={{ mb: 3 }}
        icon={isBackendConnected ? <CheckCircle /> : <ErrorOutline />}
      >
        <Typography variant="body2">
          {isBackendConnected ? (
            <>
              <strong>Backend Connected:</strong> System controls are available.
            </>
          ) : (
            <>
              <strong>Backend Disconnected:</strong> Please configure connection
              settings first.
            </>
          )}
        </Typography>
      </Alert>

      {/* System Status Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Computer color="primary" />
            <Typography variant="h6">System Status</Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
            {/* ImSwitch Status */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                ImSwitch Service
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  label={isImSwitchRunning ? "Running" : "Not Running"}
                  color={isImSwitchRunning ? "success" : "default"}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>

            {/* Disk Usage */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Disk Usage
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Storage fontSize="small" />
                <Chip
                  label={
                    isBackendConnected
                      ? diskUsage ?? "Loading..."
                      : "Backend disconnected"
                  }
                  color={getDiskUsageColor(diskUsage)}
                  size="small"
                  variant="outlined"
                />
              </Box>
              {diskUsage &&
                !diskUsage.includes("Error") &&
                !diskUsage.includes("Loading") && (
                  <LinearProgress
                    variant="determinate"
                    value={parseFloat(diskUsage.replace("%", ""))}
                    color={getDiskUsageColor(diskUsage)}
                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                  />
                )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* ImSwitch Control Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Computer color="secondary" />
            <Typography variant="h6">ImSwitch Control</Typography>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={enableImSwitch}
                onChange={(e) => setEnableImSwitch(e.target.checked)}
              />
            }
            label="Enable ImSwitch control"
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              disabled={!enableImSwitch || !isBackendConnected}
              onClick={() => callEndpoint(`${base}/restartImSwitch`)}
            >
              Restart ImSwitch
            </Button>

            <Button
              variant="outlined"
              color="secondary"
              disabled={!enableImSwitch || !isBackendConnected}
              onClick={() => callEndpoint(`${base}/stopImSwitch`)}
            >
              Stop ImSwitch
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Raspberry Pi Control Card */}
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Warning color="error" />
            <Typography variant="h6">Raspberry Pi Control</Typography>
          </Box>

          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Warning:</strong> These operations will affect the entire
              system.
            </Typography>
          </Alert>

          <FormControlLabel
            control={
              <Switch
                checked={enableRaspi}
                onChange={(e) => setEnableRaspi(e.target.checked)}
              />
            }
            label="Enable Raspberry Pi reboot"
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              color="error"
              disabled={!enableRaspi || !isBackendConnected}
              onClick={() => callEndpoint(`${base}/restartRaspi`)}
            >
              Reboot Raspberry Pi
            </Button>

            <Button
              variant="outlined"
              color="error"
              disabled={!enableRaspi || !isBackendConnected}
              onClick={() => callEndpoint(`${base}/shutdownRaspi`)}
            >
              Shutdown Raspberry Pi
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

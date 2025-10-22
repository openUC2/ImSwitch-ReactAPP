import { useState } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Paper,
  Tooltip,
} from "@mui/material";
import {
  SystemUpdate,
  Memory,
  CloudDownload,
  Warning,
  CheckCircle,
  Info,
  Refresh,
  Science,
  Computer,
} from "@mui/icons-material";

// Redux state management
import * as uc2Slice from "../state/slices/UC2Slice.js";

/**
 * ImSwitch System Update Controller
 * Handles system updates, Docker image updates, and firmware flashing
 */
const SystemUpdateController = () => {
  const [updateProgress, setUpdateProgress] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const uc2State = useSelector(uc2Slice.getUc2State);
  const isBackendConnected = uc2State.uc2Connected;

  // Mock update check (future API integration via src/backendapi/)
  const handleCheckUpdates = async () => {
    // TODO: Implement via src/backendapi/ REST endpoints
    console.log("Checking for updates...");
  };

  // Mock system update (future API integration)
  const handleSystemUpdate = async () => {
    // TODO: Implement Docker image update via backend API
    console.log("Starting system update...");
    setIsUpdating(true);
    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setUpdateProgress(i);
    }
    setIsUpdating(false);
    setUpdateProgress(0);
  };

  // Mock firmware flash (future API integration)
  const handleFirmwareFlash = async () => {
    window.open("https://youseetoo.github.io", "_blank");
    console.log("Flashing firmware...");
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          System Updates
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage ImSwitch system updates, Docker images, and device firmware
        </Typography>
      </Box>

      {/* Connection Status Alert */}
      {!isBackendConnected && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Backend connection required for system updates. Please configure
            connection in Settings.
          </Typography>
        </Alert>
      )}

      {/* Coming Soon Notice */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Info />
          <Typography variant="body2">
            <strong>Feature Preview:</strong> System update functionality is in
            development and will be available soon. This interface shows the
            planned update management capabilities.
          </Typography>
        </Box>
      </Alert>

      {/* System Update Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <SystemUpdate color="primary" />
            <Typography variant="h6">ImSwitch System Update</Typography>
            <Chip
              label="Coming Soon"
              color="warning"
              size="small"
              variant="outlined"
            />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Update the entire ImSwitch system including Docker containers,
            dependencies, and core components.
          </Typography>

          {/* Current Version Info */}
          <Paper sx={{ p: 2, bgcolor: "background.default", mb: 2 }}>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <Computer fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Current Version"
                  secondary="ImSwitch v1.4.0 (React Frontend)"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Science fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Backend Status"
                  secondary={isBackendConnected ? "Connected" : "Disconnected"}
                />
              </ListItem>
            </List>
          </Paper>

          {/* Update Progress */}
          {isUpdating && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                System Update Progress: {updateProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={updateProgress} />
            </Box>
          )}
        </CardContent>

        <CardActions>
          <Button
            startIcon={<Refresh />}
            onClick={handleCheckUpdates}
            disabled={!isBackendConnected || isUpdating}
          >
            Check for Updates
          </Button>
          <Button
            variant="contained"
            startIcon={<CloudDownload />}
            onClick={handleSystemUpdate}
            disabled={!isBackendConnected || isUpdating}
          >
            {isUpdating ? "Updating..." : "Update System"}
          </Button>
        </CardActions>
      </Card>

      {/* Firmware Update Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Memory color="secondary" />
            <Typography variant="h6">Device Firmware</Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Flash new firmware to connected microscopy devices.
          </Typography>

          {/* Firmware Status */}
          <Paper sx={{ p: 2, bgcolor: "background.default", mb: 2 }}>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <Memory fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Device Firmware"
                  secondary="UC2 ESP32 - Version detection pending"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  {isBackendConnected ? (
                    <CheckCircle fontSize="small" color="success" />
                  ) : (
                    <Warning fontSize="small" color="warning" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary="Connection Status"
                  secondary={
                    isBackendConnected
                      ? "Ready for firmware operations"
                      : "Backend connection required"
                  }
                />
              </ListItem>
            </List>
          </Paper>
        </CardContent>

        <CardActions>
          <Button
            startIcon={<Memory />}
            onClick={handleFirmwareFlash}
            disabled={!isBackendConnected}
          >
            Flash New Firmware
          </Button>
          <Tooltip title="Coming soon: Automatic firmware detection">
            <span>
              <Button startIcon={<Refresh />} disabled={true}>
                Detect Firmware
              </Button>
            </span>
          </Tooltip>
        </CardActions>
      </Card>

      {/* Future Features */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Planned Features
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CloudDownload fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Automatic Update Check"
                secondary="Scheduled checks for new ImSwitch versions"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <SystemUpdate fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Rollback Support"
                secondary="Revert to previous system version if needed"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Memory fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Bulk Firmware Update"
                secondary="Update multiple devices simultaneously"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SystemUpdateController;

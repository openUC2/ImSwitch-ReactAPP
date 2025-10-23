import { useState } from "react";
import { setNotification } from "../state/slices/NotificationSlice.js";
import { useDispatch, useSelector } from "react-redux";
import {
  setIp,
  setWebsocketPort,
  setApiPort,
} from "../state/slices/ConnectionSettingsSlice.js";
import * as uc2Slice from "../state/slices/UC2Slice.js";
import * as webSocketSlice from "../state/slices/WebSocketSlice.js";
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Chip,
  Divider,
} from "@mui/material";
import {
  Cable,
  Wifi,
  Computer,
  CheckCircle,
  Warning,
  Info,
  Save,
  Settings,
} from "@mui/icons-material";

/**
 * ImSwitch Connection Settings Component
 */
function ConnectionSettings() {
  const dispatch = useDispatch();
  const connectionSettings = useSelector(
    (state) => state.connectionSettingsState
  );

  // Get connection status from Redux state
  const uc2State = useSelector(uc2Slice.getUc2State);
  const isBackendConnected = uc2State.uc2Connected;

  // Get WebSocket connection status from Redux state
  const webSocketState = useSelector(webSocketSlice.getWebSocketState);
  const websocketTestStatus = webSocketState.testStatus;
  const isWebSocketConnected = webSocketState.connected;

  // Local state, initialized from Redux
  const [hostProtocol, setHostProtocol] = useState(
    connectionSettings.ip?.startsWith("http://") ? "http://" : "https://"
  );
  const [hostIP, setHostIP] = useState(
    connectionSettings.ip?.replace(/^https?:\/\//, "") || ""
  );
  const [websocketPort, setWebsocketPortState] = useState(
    connectionSettings.websocketPort || ""
  );
  const [apiPort, setApiPortState] = useState(connectionSettings.apiPort || "");

  // Connection test state
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Check if connection settings are configured
  const hasConnectionSettings = hostIP && apiPort;

  // Handler for saving settings with immediate connection test
  const handleSave = async () => {
    try {
      const fullIP = `${hostProtocol}${hostIP}`;

      // Save to Redux first
      dispatch(setIp(fullIP));
      dispatch(setWebsocketPort(websocketPort));
      dispatch(setApiPort(apiPort));
      dispatch(
        setNotification({ message: "Settings saved!", type: "success" })
      );

      // Trigger immediate connection check including WebSocket test
      setIsTestingConnection(true);

      // Dispatch custom event to trigger connection check in WebSocketHandler
      window.dispatchEvent(
        new CustomEvent("imswitch:checkConnection", {
          detail: {
            ip: fullIP,
            port: apiPort,
            websocketPort: websocketPort, // Add WebSocket port to test
          },
        })
      );

      // Give it a moment to complete both tests
      setTimeout(() => {
        setIsTestingConnection(false);
        dispatch(
          setNotification({
            message: "Connection tests completed - check status indicators",
            type: "info",
          })
        );
      }, 6000); // Longer timeout for both HTTP and WebSocket tests
    } catch (e) {
      dispatch(
        setNotification({ message: "Error saving settings!", type: "error" })
      );
      setIsTestingConnection(false);
    }
  };

  const isDirty =
    `${hostProtocol}${hostIP}` !== (connectionSettings.ip || "") ||
    websocketPort !== (connectionSettings.websocketPort || "") ||
    apiPort !== (connectionSettings.apiPort || "");

  const getWebSocketStatusColor = (status) => {
    switch (status) {
      case "success":
        return "success";
      case "testing":
        return "info";
      case "failed":
      case "timeout":
        return "error";
      default:
        return "default";
    }
  };

  const getWebSocketStatusLabel = (status) => {
    switch (status) {
      case "success":
        return "Connected";
      case "testing":
        return "Testing...";
      case "failed":
        return "Failed";
      case "timeout":
        return "Timeout";
      case "idle":
        return "Not Tested";
      default:
        return "Unknown";
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Backend Connection
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure connection settings for ImSwitch backend communication
        </Typography>
      </Box>

      {/* Connection Status Alert */}
      <Alert
        severity={
          isBackendConnected &&
          (websocketTestStatus === "success" || isWebSocketConnected)
            ? "success"
            : hasConnectionSettings
            ? "error"
            : "warning"
        }
        sx={{ mb: 3 }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {isBackendConnected ? (
            <CheckCircle fontSize="small" />
          ) : (
            <Warning fontSize="small" />
          )}
          <Typography variant="body2">
            {isBackendConnected ? (
              <>
                <strong>Backend Connected:</strong> Ready for microscope
                control.
                {websocketTestStatus === "success" || isWebSocketConnected ? (
                  <span> WebSocket also ready for live streaming.</span>
                ) : (
                  <span> Configure WebSocket port for live streaming.</span>
                )}
              </>
            ) : hasConnectionSettings ? (
              <>
                <strong>Connection Failed:</strong> Please check your settings
                and ensure the backend is running.
              </>
            ) : (
              <>
                <strong>Not Configured:</strong> Please configure connection
                settings below.
              </>
            )}
          </Typography>
        </Box>
      </Alert>

      {/* Connection Configuration Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Cable color="primary" />
            <Typography variant="h6">Backend Configuration</Typography>
            <Chip
              label={isBackendConnected ? "API Connected" : "API Disconnected"}
              color={isBackendConnected ? "success" : "error"}
              size="small"
              variant="outlined"
            />
            {websocketPort && (
              <Chip
                label={`WebSocket ${getWebSocketStatusLabel(
                  websocketTestStatus
                )}`}
                color={getWebSocketStatusColor(websocketTestStatus)}
                size="small"
                variant="outlined"
                icon={
                  websocketTestStatus === "testing" ? <Settings /> : undefined
                }
              />
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configure the IP address and ports for connecting to the ImSwitch
            backend server.
          </Typography>

          {/* Configuration Form */}
          <Box
            component="form"
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 2fr",
              gap: 3,
              alignItems: "start",
            }}
            autoComplete="off"
          >
            {/* Protocol Selection */}
            <TextField
              select
              id="protocol"
              label="Protocol"
              value={hostProtocol}
              onChange={(e) => setHostProtocol(e.target.value)}
              fullWidth
            >
              <MenuItem value="https://">https://</MenuItem>
              <MenuItem value="http://">http://</MenuItem>
            </TextField>

            {/* IP Address */}
            <TextField
              id="ip-address"
              label="IP Address"
              type="text"
              value={hostIP}
              onChange={(e) =>
                setHostIP(e.target.value.trim().replace(/^https?:\/\//, ""))
              }
              fullWidth
              placeholder="e.g., 192.168.1.100 or localhost"
            />

            {/* WebSocket Port */}
            <TextField
              id="port-websocket"
              label="WebSocket Port"
              type="text"
              value={websocketPort}
              onChange={(e) => setWebsocketPortState(e.target.value.trim())}
              fullWidth
              placeholder="e.g., 8001"
            />

            {/* API Port */}
            <TextField
              id="port-api"
              label="API Port"
              type="text"
              value={apiPort}
              onChange={(e) => setApiPortState(e.target.value.trim())}
              fullWidth
              placeholder="e.g., 8000"
            />
          </Box>

          {/* Current Configuration Preview */}
          {hasConnectionSettings && (
            <>
              <Divider sx={{ my: 3 }} />
              <Paper sx={{ p: 2, bgcolor: "background.default" }}>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  color="text.secondary"
                >
                  Current Configuration Preview:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <Computer fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Backend API"
                      secondary={`${hostProtocol}${hostIP}:${apiPort}`}
                    />
                    <Chip
                      label={isBackendConnected ? "Connected" : "Disconnected"}
                      color={isBackendConnected ? "success" : "error"}
                      size="small"
                      variant="outlined"
                    />
                  </ListItem>
                  {websocketPort && (
                    <ListItem>
                      <ListItemIcon>
                        <Wifi fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary="WebSocket Connection"
                        secondary={`ws://${hostIP}:${websocketPort}`}
                      />
                      <Chip
                        label={getWebSocketStatusLabel(websocketTestStatus)}
                        color={getWebSocketStatusColor(websocketTestStatus)}
                        size="small"
                        variant="outlined"
                      />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </>
          )}
        </CardContent>

        <CardActions sx={{ p: 2, pt: 0 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={!isDirty || isTestingConnection}
            startIcon={
              isTestingConnection ? <CircularProgress size={16} /> : <Save />
            }
          >
            {isTestingConnection
              ? "Testing Connection..."
              : "Save & Test Connection"}
          </Button>

          {isTestingConnection && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              Checking backend connection...
            </Typography>
          )}
        </CardActions>
      </Card>

      {/* Connection Help Card */}
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Info color="info" />
            <Typography variant="h6">Connection Help</Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Common configuration examples and troubleshooting tips.
          </Typography>

          <List dense>
            <ListItem>
              <ListItemIcon>
                <Computer fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Local Development"
                secondary="IP: localhost, API Port: 8000, WebSocket Port: 8001"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Wifi fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Raspberry Pi"
                secondary="IP: 192.168.1.x (check your router), same ports as above"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Warning fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Troubleshooting"
                secondary="Ensure backend server is running and firewall allows connections"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}

export default ConnectionSettings;

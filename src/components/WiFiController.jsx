// src/components/WiFiController.js
import {
  Info as InfoIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Refresh as RefreshIcon,
  Router as RouterIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { green, orange, red } from "@mui/material/colors";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as connectionSettingsSlice from "../state/slices/ConnectionSettingsSlice.js";
import * as wifiSlice from "../state/slices/WiFiSlice.js";

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`wifi-tabpanel-${index}`}
      aria-labelledby={`wifi-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
};

const WiFiController = () => {
  // Access ImSwitch backend connection settings from Redux - following Copilot Instructions
  const connectionSettingsState = useSelector(
    connectionSettingsSlice.getConnectionSettingsState
  );
  const hostIP = connectionSettingsState.ip;
  const hostPort = connectionSettingsState.apiPort;

  const dispatch = useDispatch();

  // Access global Redux state
  const wifiState = useSelector(wifiSlice.getWiFiState);

  // Fetch current connection status on mount
  useEffect(() => {
    fetchCurrentSSID();
    scanNetworks();

    // Set up periodic status check
    const interval = setInterval(() => {
      fetchCurrentSSID();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [hostIP, hostPort]);

  // API call functions
  const scanNetworks = async () => {
    dispatch(wifiSlice.setIsScanning(true));
    dispatch(wifiSlice.clearError());

    try {
      const response = await fetch(
        `${hostIP}:${hostPort}/WiFiController/scanNetworks`
      );
      const data = await response.json();

      if (data.error) {
        dispatch(wifiSlice.setLastError(data.error));
      } else {
        dispatch(wifiSlice.setAvailableNetworks(data.networks || []));
        if (data.ifname) {
          dispatch(wifiSlice.setCurrentIfname(data.ifname));
        }
      }
    } catch (error) {
      dispatch(
        wifiSlice.setLastError(`Failed to scan networks: ${error.message}`)
      );
    } finally {
      dispatch(wifiSlice.setIsScanning(false));
    }
  };

  const fetchCurrentSSID = async () => {
    try {
      const response = await fetch(
        `${hostIP}:${hostPort}/WiFiController/getCurrentSSID`
      );
      const data = await response.json();

      dispatch(wifiSlice.setCurrentSSID(data.ssid));
      dispatch(wifiSlice.setCurrentIfname(data.ifname));
      dispatch(wifiSlice.setIsConnected(!!data.ssid));
      dispatch(wifiSlice.setConnectionInfo(data));
    } catch (error) {
      console.error("Failed to fetch current SSID:", error);
    }
  };

  const connectToNetwork = async () => {
    if (!wifiState.selectedSSID) {
      dispatch(wifiSlice.setLastError("Please select a network"));
      return;
    }

    dispatch(wifiSlice.setIsConnecting(true));
    dispatch(wifiSlice.clearError());

    try {
      const params = new URLSearchParams({
        ssid: wifiState.selectedSSID,
        ...(wifiState.password && { password: wifiState.password }),
        ...(wifiState.ifname && { ifname: wifiState.ifname }),
      });

      const response = await fetch(
        `${hostIP}:${hostPort}/WiFiController/connectNetwork?${params}`
      );
      const data = await response.json();

      if (data.error) {
        dispatch(wifiSlice.setLastError(data.error));
      } else {
        // Clear form and refresh status
        dispatch(wifiSlice.setSelectedSSID(""));
        dispatch(wifiSlice.setPassword(""));
        setTimeout(() => {
          fetchCurrentSSID();
        }, 2000);
      }
    } catch (error) {
      dispatch(wifiSlice.setLastError(`Failed to connect: ${error.message}`));
    } finally {
      dispatch(wifiSlice.setIsConnecting(false));
    }
  };

  const startAccessPoint = async () => {
    if (!wifiState.apSSID || !wifiState.apPassword) {
      dispatch(
        wifiSlice.setLastError(
          "Please enter SSID and password for access point"
        )
      );
      return;
    }

    if (wifiState.apPassword.length < 8) {
      dispatch(
        wifiSlice.setLastError("Password must be at least 8 characters")
      );
      return;
    }

    dispatch(wifiSlice.setIsCreatingAP(true));
    dispatch(wifiSlice.clearError());

    try {
      const params = new URLSearchParams({
        ssid: wifiState.apSSID,
        password: wifiState.apPassword,
        ...(wifiState.apIfname && { ifname: wifiState.apIfname }),
        con_name: wifiState.apConName,
        band: wifiState.apBand,
        ...(wifiState.apChannel && { channel: wifiState.apChannel.toString() }),
      });

      const response = await fetch(
        `${hostIP}:${hostPort}/WiFiController/startAccessPoint?${params}`
      );
      const data = await response.json();

      if (data.error) {
        dispatch(wifiSlice.setLastError(data.error));
      } else {
        dispatch(wifiSlice.setIsAPActive(true));
        dispatch(wifiSlice.setApInfo(data));
      }
    } catch (error) {
      dispatch(
        wifiSlice.setLastError(`Failed to start access point: ${error.message}`)
      );
    } finally {
      dispatch(wifiSlice.setIsCreatingAP(false));
    }
  };

  const stopAccessPoint = async () => {
    try {
      const params = new URLSearchParams({
        con_name: wifiState.apConName,
      });

      const response = await fetch(
        `${hostIP}:${hostPort}/WiFiController/stopAccessPoint?${params}`
      );
      const data = await response.json();

      if (data.error) {
        dispatch(wifiSlice.setLastError(data.error));
      } else {
        dispatch(wifiSlice.setIsAPActive(false));
        dispatch(wifiSlice.setApInfo({}));
      }
    } catch (error) {
      dispatch(
        wifiSlice.setLastError(`Failed to stop access point: ${error.message}`)
      );
    }
  };

  const handleTabChange = (event, newValue) => {
    dispatch(wifiSlice.setTabIndex(newValue));
    dispatch(wifiSlice.clearError());
  };

  const getSignalIcon = (signal) => {
    if (!signal) return <WifiOffIcon />;
    if (signal > -50) return <WifiIcon style={{ color: green[500] }} />;
    if (signal > -70) return <WifiIcon style={{ color: orange[500] }} />;
    return <WifiIcon style={{ color: red[500] }} />;
  };

  const getSecurityIcon = (security) => {
    return security && security !== "--" ? (
      <LockIcon fontSize="small" />
    ) : (
      <LockOpenIcon fontSize="small" />
    );
  };

  return (
    <Paper>
      <Tabs
        value={wifiState.tabIndex}
        onChange={handleTabChange}
        aria-label="WiFi Controller Tabs"
      >
        <Tab label="Connect to Network" icon={<WifiIcon />} />
        <Tab label="Create Access Point" icon={<RouterIcon />} />
        <Tab label="Connection Info" icon={<InfoIcon />} />
      </Tabs>

      {/* Error Alert */}
      {wifiState.lastError && (
        <Alert
          severity="error"
          onClose={() => dispatch(wifiSlice.clearError())}
          sx={{ m: 2 }}
        >
          {wifiState.lastError}
        </Alert>
      )}

      {/* Tab 1: Connect to Network */}
      <TabPanel value={wifiState.tabIndex} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Typography variant="h6">Available Networks</Typography>
              <IconButton
                onClick={scanNetworks}
                disabled={wifiState.isScanning}
              >
                <RefreshIcon />
              </IconButton>
              {wifiState.isScanning && <CircularProgress size={20} />}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ maxHeight: 400, overflow: "auto" }}>
              <List>
                {wifiState.availableNetworks.map((network, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemButton
                      selected={wifiState.selectedSSID === network.ssid}
                      onClick={() => {
                        dispatch(wifiSlice.setSelectedSSID(network.ssid));
                        dispatch(wifiSlice.setPassword(""));
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} mr={2}>
                        {getSignalIcon(network.signal)}
                        {getSecurityIcon(network.security)}
                      </Box>
                      <ListItemText
                        primary={network.ssid || "(Hidden Network)"}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              Signal:{" "}
                              {network.signal
                                ? `${network.signal} dBm`
                                : "Unknown"}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Security: {network.security || "Open"}
                            </Typography>
                            {network.channel && (
                              <Typography variant="caption" display="block">
                                Channel: {network.channel}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
                {wifiState.availableNetworks.length === 0 &&
                  !wifiState.isScanning && (
                    <ListItem>
                      <ListItemText primary="No networks found. Click refresh to scan." />
                    </ListItem>
                  )}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Selected Network"
                  value={wifiState.selectedSSID}
                  onChange={(e) =>
                    dispatch(wifiSlice.setSelectedSSID(e.target.value))
                  }
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Password"
                  type="password"
                  value={wifiState.password}
                  onChange={(e) =>
                    dispatch(wifiSlice.setPassword(e.target.value))
                  }
                  fullWidth
                  variant="outlined"
                  helperText="Leave empty for open networks"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Interface (optional)"
                  value={wifiState.ifname}
                  onChange={(e) =>
                    dispatch(wifiSlice.setIfname(e.target.value))
                  }
                  fullWidth
                  variant="outlined"
                  helperText="Leave empty to use default interface"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={connectToNetwork}
                  disabled={wifiState.isConnecting || !wifiState.selectedSSID}
                  fullWidth
                  size="large"
                >
                  {wifiState.isConnecting ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Connecting...
                    </>
                  ) : (
                    "Connect"
                  )}
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 2: Create Access Point */}
      <TabPanel value={wifiState.tabIndex} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Create WiFi Hotspot
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Hotspot Name (SSID)"
              value={wifiState.apSSID}
              onChange={(e) => dispatch(wifiSlice.setApSSID(e.target.value))}
              fullWidth
              variant="outlined"
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Password"
              type="password"
              value={wifiState.apPassword}
              onChange={(e) =>
                dispatch(wifiSlice.setApPassword(e.target.value))
              }
              fullWidth
              variant="outlined"
              required
              helperText="Minimum 8 characters"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Interface (optional)"
              value={wifiState.apIfname}
              onChange={(e) => dispatch(wifiSlice.setApIfname(e.target.value))}
              fullWidth
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Connection Name"
              value={wifiState.apConName}
              onChange={(e) => dispatch(wifiSlice.setApConName(e.target.value))}
              fullWidth
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Band</InputLabel>
              <Select
                value={wifiState.apBand}
                onChange={(e) => dispatch(wifiSlice.setApBand(e.target.value))}
                label="Band"
              >
                <MenuItem value="bg">2.4 GHz (bg)</MenuItem>
                <MenuItem value="a">5 GHz (a)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Channel (optional)"
              type="number"
              value={wifiState.apChannel || ""}
              onChange={(e) =>
                dispatch(
                  wifiSlice.setApChannel(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                )
              }
              fullWidth
              variant="outlined"
              helperText="Leave empty for automatic"
            />
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={startAccessPoint}
                disabled={wifiState.isCreatingAP || wifiState.isAPActive}
                size="large"
              >
                {wifiState.isCreatingAP ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Creating Hotspot...
                  </>
                ) : (
                  "Start Access Point"
                )}
              </Button>

              {wifiState.isAPActive && (
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={stopAccessPoint}
                  size="large"
                >
                  Stop Access Point
                </Button>
              )}
            </Box>
          </Grid>

          {wifiState.isAPActive && wifiState.apInfo && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Access Point Active
                  </Typography>
                  <Typography>
                    <strong>SSID:</strong> {wifiState.apInfo.ssid}
                  </Typography>
                  <Typography>
                    <strong>Interface:</strong> {wifiState.apInfo.ifname}
                  </Typography>
                  <Typography>
                    <strong>IP Address:</strong> {wifiState.apInfo.ipv4}
                  </Typography>
                  <Typography>
                    <strong>Connection Name:</strong>{" "}
                    {wifiState.apInfo.con_name}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* Tab 3: Connection Info */}
      <TabPanel value={wifiState.tabIndex} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Connection Status
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  {wifiState.isConnected ? (
                    <WifiIcon style={{ color: green[500] }} />
                  ) : (
                    <WifiOffIcon style={{ color: red[500] }} />
                  )}
                  <Typography variant="h6">
                    {wifiState.isConnected ? "Connected" : "Disconnected"}
                  </Typography>
                </Box>

                {wifiState.isConnected && (
                  <>
                    <Typography>
                      <strong>Network:</strong> {wifiState.currentSSID}
                    </Typography>
                    <Typography>
                      <strong>Interface:</strong> {wifiState.currentIfname}
                    </Typography>
                  </>
                )}

                {!wifiState.isConnected && (
                  <Typography color="textSecondary">
                    No active WiFi connection
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <RouterIcon
                    style={{
                      color: wifiState.isAPActive ? green[500] : red[500],
                    }}
                  />
                  <Typography variant="h6">
                    Access Point {wifiState.isAPActive ? "Active" : "Inactive"}
                  </Typography>
                </Box>

                {wifiState.isAPActive && wifiState.apInfo && (
                  <>
                    <Typography>
                      <strong>SSID:</strong> {wifiState.apInfo.ssid}
                    </Typography>
                    <Typography>
                      <strong>Interface:</strong> {wifiState.apInfo.ifname}
                    </Typography>
                    <Typography>
                      <strong>IP Address:</strong> {wifiState.apInfo.ipv4}
                    </Typography>
                  </>
                )}

                {!wifiState.isAPActive && (
                  <Typography color="textSecondary">
                    No active access point
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="outlined"
              onClick={() => {
                fetchCurrentSSID();
                scanNetworks();
              }}
              startIcon={<RefreshIcon />}
            >
              Refresh Status
            </Button>
          </Grid>
        </Grid>
      </TabPanel>
    </Paper>
  );
};

export default WiFiController;

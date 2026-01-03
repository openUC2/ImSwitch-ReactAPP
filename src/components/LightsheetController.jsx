// src/components/LightsheetController.js
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import ViewInArIcon from "@mui/icons-material/ViewInAr";
import DownloadIcon from "@mui/icons-material/Download";
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
  Chip,
} from "@mui/material";
import { green, red, orange } from "@mui/material/colors";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import LiveViewControlWrapper from "../axon/LiveViewControlWrapper.js";
import * as connectionSettingsSlice from "../state/slices/ConnectionSettingsSlice.js";
import * as lightsheetSlice from "../state/slices/LightsheetSlice.js";
import * as positionSlice from "../state/slices/PositionSlice.js";
import ErrorBoundary from "./ErrorBoundary.js";
import VtkViewer from "./VtkViewer.js";
import Lightsheet3DViewer from "./Lightsheet3DViewer.jsx";
import AxisConfigurationMenu from "./AxisConfigurationMenu.jsx";
import LightsheetPositionControls from "./LightsheetPositionControls.jsx";
import VizarrViewer from "./VizarrViewer.jsx";
import apiPositionerControllerGetPositions from "../backendapi/apiPositionerControllerGetPositions.js";
import {
  apiStartStepAcquireScan,
  apiStartContinuousScanWithZarr,
  apiGetScanStatus,
  apiGetAvailableScanModes,
  apiGetAvailableStorageFormats,
  apiGetLatestZarrPath,
} from "../backendapi/apiLightsheetController.js";

// Import Socket.IO client for real-time updates
import { io } from "socket.io-client";

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
};

/**
 * ImSwitch Lightsheet Controller Component
 * Manages 3D lightsheet microscopy scanning and visualization
 * Follows Copilot Instructions for Redux state management and API communication
 * 
 * Features:
 * - Continuous scan mode (original fast scan)
 * - Step-Acquire mode (Go-Stop-Acquire for high-quality Z-stacks)
 * - OME-Zarr and TIFF storage formats
 * - Real-time progress updates via Socket.IO
 * - 3D visualization using VizarrViewer
 */
const LightsheetController = () => {
  // Access ImSwitch backend connection settings from Redux - following Copilot Instructions
  const connectionSettingsState = useSelector(
    connectionSettingsSlice.getConnectionSettingsState
  );
  const hostIP = connectionSettingsState.ip;
  const hostPort = connectionSettingsState.apiPort;

  // Redux dispatcher and lightsheet state
  const dispatch = useDispatch();

  // Access global Redux state
  const lightsheetState = useSelector(lightsheetSlice.getLightsheetState);

  // Use Redux state instead of local useState
  const tabIndex = lightsheetState.tabIndex;
  const minPos = lightsheetState.minPos;
  const maxPos = lightsheetState.maxPos;
  const speed = lightsheetState.speed;
  const stepSize = lightsheetState.stepSize;
  const axis = lightsheetState.axis;
  const illuSource = lightsheetState.illuSource;
  const illuValue = lightsheetState.illuValue;
  const isRunning = lightsheetState.isRunning;
  const scanMode = lightsheetState.scanMode;
  const storageFormat = lightsheetState.storageFormat;
  const experimentName = lightsheetState.experimentName;
  const scanStatus = lightsheetState.scanStatus;
  const availableScanModes = lightsheetState.availableScanModes;
  const availableStorageFormats = lightsheetState.availableStorageFormats;
  const latestZarrPath = lightsheetState.latestZarrPath;

  // Local state for socket connection
  const [socketConnected, setSocketConnected] = useState(false);
  const [showZarrViewer, setShowZarrViewer] = useState(false);

  // Initialize Socket.IO connection for real-time updates
  useEffect(() => {
    if (!hostIP || !hostPort) return;

    // Build socket URL
    const socketUrl = `${hostIP}:${hostPort}`;
    const socket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Lightsheet Controller: Socket.IO connected');
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Lightsheet Controller: Socket.IO disconnected');
      setSocketConnected(false);
    });

    // Listen for lightsheet status updates from backend
    socket.on('lightsheet_status', (data) => {
      console.log('Lightsheet status update:', data);
      dispatch(lightsheetSlice.setScanStatus(data));
    });

    return () => {
      socket.disconnect();
    };
  }, [hostIP, hostPort, dispatch]);

  // Fetch available scan modes and storage formats on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const modes = await apiGetAvailableScanModes();
        if (Array.isArray(modes)) {
          dispatch(lightsheetSlice.setAvailableScanModes(modes));
        }
        
        const formats = await apiGetAvailableStorageFormats();
        if (Array.isArray(formats)) {
          dispatch(lightsheetSlice.setAvailableStorageFormats(formats));
        }
      } catch (error) {
        console.error("Error fetching options:", error);
      }
    };

    if (hostIP && hostPort) {
      fetchOptions();
    }
  }, [hostIP, hostPort, dispatch]);

  // Poll scan status when not using sockets
  useEffect(() => {
    if (!hostIP || !hostPort || socketConnected) return;

    const pollStatus = async () => {
      if (isRunning) {
        try {
          const status = await apiGetScanStatus();
          dispatch(lightsheetSlice.setScanStatus(status));
        } catch (error) {
          console.error("Error polling scan status:", error);
        }
      }
    };

    const interval = setInterval(pollStatus, 1000);
    return () => clearInterval(interval);
  }, [hostIP, hostPort, isRunning, socketConnected, dispatch]);

  // Poll current positions for 3D visualization
  useEffect(() => {
    if (!hostIP || !hostPort) return;

    const fetchPositions = async () => {
      try {
        const positionsData = await apiPositionerControllerGetPositions();
        
        const positions = {};
        if (positionsData) {
          ['X', 'Y', 'Z', 'A'].forEach(axis => {
            if (typeof positionsData[axis] !== 'undefined') {
              positions[axis.toLowerCase()] = positionsData[axis];
            }
          });
          
          if (Object.keys(positions).length > 0) {
            dispatch(lightsheetSlice.setAllStagePositions(positions));
          }
        }
      } catch (error) {
        console.error("Error fetching stage positions:", error);
      }
    };

    fetchPositions();
    const interval = setInterval(fetchPositions, 20000);
    return () => clearInterval(interval);
  }, [hostIP, hostPort, dispatch]);

  // Sync global positionSlice with lightsheet-specific stagePositions
  // This ensures 3D model updates immediately when position changes via ANY route (buttons, websockets, etc.)
  const globalPositionState = useSelector(positionSlice.getPositionState);
  useEffect(() => {
    const positions = {};
    ['x', 'y', 'z', 'a'].forEach(axis => {
      if (typeof globalPositionState[axis] !== 'undefined') {
        positions[axis] = globalPositionState[axis];
      }
    });
    
    if (Object.keys(positions).length > 0) {
      dispatch(lightsheetSlice.setAllStagePositions(positions));
    }
  }, [globalPositionState.x, globalPositionState.y, globalPositionState.z, globalPositionState.a, dispatch]);

  // Start scanning based on selected mode
  const startScanning = useCallback(async () => {
    try {
      let result;
      
      if (scanMode === "step_acquire") {
        result = await apiStartStepAcquireScan({
          minPos: parseFloat(minPos),
          maxPos: parseFloat(maxPos),
          stepSize: parseFloat(stepSize),
          axis,
          illuSource: illuSource.toString(),
          illuValue: parseFloat(illuValue),
          storageFormat,
          experimentName,
        });
      } else {
        result = await apiStartContinuousScanWithZarr({
          minPos: parseFloat(minPos),
          maxPos: parseFloat(maxPos),
          speed: parseFloat(speed),
          axis,
          illuSource: illuSource.toString(),
          illuValue: parseFloat(illuValue),
          storageFormat,
          experimentName,
        });
      }

      console.log("Scan started:", result);
      if (result.success) {
        dispatch(lightsheetSlice.setIsRunning(true));
      }
    } catch (error) {
      console.error("Error starting scan:", error);
    }
  }, [scanMode, minPos, maxPos, stepSize, speed, axis, illuSource, illuValue, storageFormat, experimentName, dispatch]);

  // Fetch and show latest Zarr for visualization
  const openZarrViewer = useCallback(async () => {
    try {
      const zarrInfo = await apiGetLatestZarrPath();
      if (zarrInfo.exists && zarrInfo.zarrPath) {
        dispatch(lightsheetSlice.setLatestZarrPath(zarrInfo));
        setShowZarrViewer(true);
      } else {
        alert("No Zarr data available yet. Run a scan first.");
      }
    } catch (error) {
      console.error("Error getting Zarr path:", error);
    }
  }, [dispatch]);

  const handleTabChange = (event, newValue) => {
    dispatch(lightsheetSlice.setTabIndex(newValue));
  };

  // Format display labels for scan modes
  const getScanModeLabel = (mode) => {
    const labels = {
      continuous: "Continuous (Fast)",
      step_acquire: "Step-Acquire (High Quality)",
    };
    return labels[mode] || mode;
  };

  // Format display labels for storage formats
  const getStorageFormatLabel = (format) => {
    const labels = {
      tiff: "TIFF Stack",
      ome_zarr: "OME-Zarr",
      both: "Both (TIFF + Zarr)",
    };
    return labels[format] || format;
  };

  return (
    <Paper>
      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        aria-label="Lightsheet Controller Tabs"
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Scanning Parameters" />
        <Tab label="Galvo Scanner" />
        <Tab label="View Latest Stack" />
        <Tab label="3D Zarr Viewer" />
        <Tab label="VTK Viewer" />
      </Tabs>

      <TabPanel value={tabIndex} index={0}>
        <Grid container spacing={3}>
          {/* Connection Status */}
          <Grid item xs={12}>
            <Box display="flex" gap={1} alignItems="center" mb={2}>
              <Chip
                label={socketConnected ? "Socket Connected" : "Polling Mode"}
                color={socketConnected ? "success" : "warning"}
                size="small"
              />
              {scanStatus.scanMode && (
                <Chip
                  label={`Mode: ${getScanModeLabel(scanStatus.scanMode)}`}
                  color="info"
                  size="small"
                />
              )}
            </Box>
          </Grid>

          {/* 2D Live View */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Live View (2D)
            </Typography>
            <LiveViewControlWrapper />
          </Grid>

          {/* 3D Visualization */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              3D Assembly View
            </Typography>
            <Lightsheet3DViewer
              positions={lightsheetState.stagePositions}
              axisConfig={lightsheetState.axisConfig}
              width={600}
              height={400}
            />
          </Grid>

          {/* Axis Configuration Menu */}
          <Grid item xs={12}>
            <AxisConfigurationMenu />
          </Grid>

          {/* Position Controls */}
          <Grid item xs={12}>
            <LightsheetPositionControls />
          </Grid>

          {/* Scan Mode Selection */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Scan Configuration
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Scan Mode</InputLabel>
              <Select
                value={scanMode}
                onChange={(e) => dispatch(lightsheetSlice.setScanMode(e.target.value))}
                label="Scan Mode"
              >
                {availableScanModes.map((mode) => (
                  <MenuItem key={mode} value={mode}>
                    {getScanModeLabel(mode)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Storage Format</InputLabel>
              <Select
                value={storageFormat}
                onChange={(e) => dispatch(lightsheetSlice.setStorageFormat(e.target.value))}
                label="Storage Format"
              >
                {availableStorageFormats.map((format) => (
                  <MenuItem key={format} value={format}>
                    {getStorageFormatLabel(format)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Experiment Name"
              value={experimentName}
              onChange={(e) => dispatch(lightsheetSlice.setExperimentName(e.target.value))}
              fullWidth
              variant="outlined"
            />
          </Grid>

          {/* Scanning Parameters */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Scanning Parameters
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              label="Min Position (µm)"
              value={minPos}
              onChange={(e) => dispatch(lightsheetSlice.setMinPos(e.target.value))}
              fullWidth
              type="number"
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Max Position (µm)"
              value={maxPos}
              onChange={(e) => dispatch(lightsheetSlice.setMaxPos(e.target.value))}
              fullWidth
              type="number"
              variant="outlined"
            />
          </Grid>
          
          {/* Show step size for step-acquire mode, speed for continuous */}
          {scanMode === "step_acquire" ? (
            <Grid item xs={12} md={4}>
              <TextField
                label="Step Size (µm)"
                value={stepSize}
                onChange={(e) => dispatch(lightsheetSlice.setStepSize(e.target.value))}
                fullWidth
                type="number"
                variant="outlined"
                inputProps={{ min: 0.1, step: 0.1 }}
              />
            </Grid>
          ) : (
            <Grid item xs={12} md={4}>
              <TextField
                label="Speed"
                value={speed}
                onChange={(e) => dispatch(lightsheetSlice.setSpeed(e.target.value))}
                fullWidth
                type="number"
                variant="outlined"
              />
            </Grid>
          )}

          <Grid item xs={12} md={4}>
            <TextField
              label="Axis"
              value={axis}
              onChange={(e) => dispatch(lightsheetSlice.setAxis(e.target.value))}
              fullWidth
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Illumination Source"
              value={illuSource}
              onChange={(e) => dispatch(lightsheetSlice.setIlluSource(e.target.value))}
              fullWidth
              type="number"
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Illumination Value"
              value={illuValue}
              onChange={(e) => dispatch(lightsheetSlice.setIlluValue(e.target.value))}
              fullWidth
              type="number"
              variant="outlined"
            />
          </Grid>

          {/* Progress Display */}
          {(isRunning || scanStatus.progress > 0) && (
            <Grid item xs={12}>
              <Box sx={{ width: '100%' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {isRunning 
                    ? `Scanning... Frame ${scanStatus.currentFrame}/${scanStatus.totalPositions || '?'} at position ${scanStatus.currentPosition?.toFixed(1) || 0} µm`
                    : "Scan complete"}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={scanStatus.progress || 0}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
            </Grid>
          )}

          {/* Error Display */}
          {scanStatus.errorMessage && (
            <Grid item xs={12}>
              <Alert severity="error">{scanStatus.errorMessage}</Alert>
            </Grid>
          )}

          {/* Control Buttons */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={startScanning}
                disabled={isRunning}
                size="large"
                startIcon={<PlayArrowIcon />}
              >
                {scanMode === "step_acquire" ? "Start Step-Acquire" : "Start Continuous Scan"}
              </Button>
              
              {isRunning && (
                <Button
                  variant="contained"
                  color="error"
                  size="large"
                  startIcon={<StopIcon />}
                  onClick={() => {
                    // TODO: Implement stop functionality via API
                    fetch(`${hostIP}:${hostPort}/LightsheetController/stopLightsheet`);
                  }}
                >
                  Stop
                </Button>
              )}

              <Button
                variant="outlined"
                color="secondary"
                onClick={openZarrViewer}
                disabled={isRunning}
                startIcon={<ViewInArIcon />}
              >
                View Latest Zarr
              </Button>

              {isRunning ? (
                <CheckCircleIcon style={{ color: green[500] }} />
              ) : (
                <CancelIcon style={{ color: scanStatus.progress >= 100 ? green[500] : red[500] }} />
              )}
              <Typography variant="body2">
                {isRunning 
                  ? "Scanning in progress..." 
                  : scanStatus.progress >= 100 
                    ? "Scan complete" 
                    : "Ready to scan"}
              </Typography>
            </Box>
          </Grid>

          {/* Result Paths */}
          {(scanStatus.zarrPath || scanStatus.tiffPath) && (
            <Grid item xs={12}>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Output Files:
                </Typography>
                {scanStatus.zarrPath && (
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    Zarr: {scanStatus.zarrPath}
                  </Typography>
                )}
                {scanStatus.tiffPath && (
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    TIFF: {scanStatus.tiffPath}
                  </Typography>
                )}
              </Box>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      <TabPanel value={tabIndex} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Galvo Scanner Configuration
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <LiveViewControlWrapper />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Channel"
              value={lightsheetState.galvoChannel || 2}
              onChange={(e) =>
                dispatch(
                  lightsheetSlice.setGalvoChannel(parseInt(e.target.value))
                )
              }
              fullWidth
              type="number"
              variant="outlined"
              inputProps={{ min: 1, max: 2 }}
              helperText="Channel: 1 or 2"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Frequency"
              value={lightsheetState.galvoFrequency || 20}
              onChange={(e) =>
                dispatch(
                  lightsheetSlice.setGalvoFrequency(parseFloat(e.target.value))
                )
              }
              fullWidth
              type="number"
              variant="outlined"
              inputProps={{ min: 0, step: 0.1 }}
              helperText="Frequency (Hz)"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Offset"
              value={lightsheetState.galvoOffset || 0}
              onChange={(e) =>
                dispatch(
                  lightsheetSlice.setGalvoOffset(parseFloat(e.target.value))
                )
              }
              fullWidth
              type="number"
              variant="outlined"
              inputProps={{ step: 0.1 }}
              helperText="Offset value"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Amplitude"
              value={lightsheetState.galvoAmplitude || 2}
              onChange={(e) =>
                dispatch(
                  lightsheetSlice.setGalvoAmplitude(parseFloat(e.target.value))
                )
              }
              fullWidth
              type="number"
              variant="outlined"
              inputProps={{ min: 0, step: 0.1 }}
              helperText="Amplitude value"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Clock Divider"
              value={lightsheetState.galvoClkDiv || 0}
              onChange={(e) =>
                dispatch(
                  lightsheetSlice.setGalvoClkDiv(parseInt(e.target.value))
                )
              }
              fullWidth
              type="number"
              variant="outlined"
              inputProps={{ min: 0 }}
              helperText="Clock divider"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Phase"
              value={lightsheetState.galvoPhase || 0}
              onChange={(e) =>
                dispatch(
                  lightsheetSlice.setGalvoPhase(parseInt(e.target.value))
                )
              }
              fullWidth
              type="number"
              variant="outlined"
              helperText="Phase value"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Invert"
              value={lightsheetState.galvoInvert || 1}
              onChange={(e) =>
                dispatch(
                  lightsheetSlice.setGalvoInvert(parseInt(e.target.value))
                )
              }
              fullWidth
              type="number"
              variant="outlined"
              inputProps={{ min: 0, max: 1 }}
              helperText="Invert: 0 or 1"
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                const channel = lightsheetState.galvoChannel || 1;
                const frequency = lightsheetState.galvoFrequency || 10;
                const offset = lightsheetState.galvoOffset || 0;
                const amplitude = lightsheetState.galvoAmplitude || 1;
                const clk_div = lightsheetState.galvoClkDiv || 0;
                const phase = lightsheetState.galvoPhase || 0;
                const invert = lightsheetState.galvoInvert || 1;

                const url = `${hostIP}:${hostPort}/LightsheetController/setGalvo?channel=${channel}&frequency=${frequency}&offset=${offset}&amplitude=${amplitude}&clk_div=${clk_div}&phase=${phase}&invert=${invert}`;

                fetch(url, { method: "GET" })
                  .then((response) => response.json())
                  .then((data) => {
                    console.log("Galvo parameters set:", data);
                  })
                  .catch((error) =>
                    console.error("Error setting galvo parameters:", error)
                  );
              }}
              size="large"
            >
              Apply Galvo Settings
            </Button>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabIndex} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Download & External Viewers
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<ViewInArIcon />}
              onClick={() =>
                window.open(
                  `https://kitware.github.io/itk-vtk-viewer/app/?rotate=false&fileToLoad=${hostIP}:${hostPort}/LightsheetController/getLatestLightsheetStackAsTif`,
                  "_blank"
                )
              }
            >
              Open in ITK-VTK Viewer (requires internet)
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<DownloadIcon />}
              onClick={() =>
                window.open(
                  `${hostIP}:${hostPort}/LightsheetController/getLatestLightsheetStackAsTif`,
                  "_blank"
                )
              }
            >
              Download Latest TIFF Stack
            </Button>
          </Grid>
          {latestZarrPath && (
            <Grid item xs={12}>
              <Alert severity="info">
                Latest Zarr path: {latestZarrPath}
              </Alert>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* 3D Zarr Viewer Tab */}
      <TabPanel value={tabIndex} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              3D OME-Zarr Viewer
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Visualize lightsheet Z-stacks directly in the browser using the offline-capable Zarr viewer.
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Box display="flex" gap={2} mb={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={openZarrViewer}
                startIcon={<ViewInArIcon />}
              >
                Load Latest Zarr Stack
              </Button>
              <Button
                variant="outlined"
                onClick={() => setShowZarrViewer(false)}
                disabled={!showZarrViewer}
              >
                Close Viewer
              </Button>
            </Box>
          </Grid>

          {showZarrViewer && latestZarrPath ? (
            <Grid item xs={12}>
              <ErrorBoundary>
                <Box sx={{ height: '70vh', width: '100%' }}>
                  <VizarrViewer
                    zarrUrl={latestZarrPath}
                    onClose={() => setShowZarrViewer(false)}
                    embedded={true}
                    height="100%"
                    width="100%"
                  />
                </Box>
              </ErrorBoundary>
            </Grid>
          ) : (
            <Grid item xs={12}>
              <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.100', borderRadius: 2 }}>
                <Typography variant="body1" color="text.secondary">
                  {latestZarrPath 
                    ? "Click 'Load Latest Zarr Stack' to view the data"
                    : "No Zarr data available. Run a scan with OME-Zarr storage format first."}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* VTK Viewer Tab */}
      <TabPanel value={tabIndex} index={4}>
        <ErrorBoundary>
          <Typography variant="h6" gutterBottom>
            VTK Volume Viewer (TIFF)
          </Typography>
          <VtkViewer
            tifUrl={`${hostIP}:${hostPort}/LightsheetController/getLatestLightsheetStackAsTif`}
          />
        </ErrorBoundary>
      </TabPanel>
    </Paper>
  );
};

export default LightsheetController;

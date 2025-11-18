import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Grid, 
  TextField, 
  Switch, 
  FormControlLabel,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useSelector } from 'react-redux';
import { getConnectionSettingsState } from '../../state/slices/ConnectionSettingsSlice';

import apiPixelCalibrationControllerOverviewStream from '../../backendapi/apiPixelCalibrationControllerOverviewStream';
import apiPixelCalibrationControllerOverviewIdentifyAxes from '../../backendapi/apiPixelCalibrationControllerOverviewIdentifyAxes';
import apiPixelCalibrationControllerGridSetRotation180 from '../../backendapi/apiPixelCalibrationControllerGridSetRotation180';
import apiPixelCalibrationControllerGridSetConfig from '../../backendapi/apiPixelCalibrationControllerGridSetConfig';
import apiPixelCalibrationControllerGridDetectTags from '../../backendapi/apiPixelCalibrationControllerGridDetectTags';
import apiPixelCalibrationControllerGridMoveToTag from '../../backendapi/apiPixelCalibrationControllerGridMoveToTag';
import apiPixelCalibrationControllerToggleAprilTagOverlay from '../../backendapi/apiPixelCalibrationControllerToggleAprilTagOverlay';
import apiLEDMatrixControllerSetAllLED from '../../backendapi/apiLEDMatrixControllerSetAllLED';

/**
 * TrackMotionTab - AprilTag grid calibration and motion tracking
 * 
 * Features:
 * - Overview camera stream with AprilTag overlay
 * - LED/LED matrix control
 * - Axis identification and calibration
 * - AprilTag detection and navigation
 * - Grid configuration (rows, cols, pitch)
 */
const TrackMotionTab = () => {
  const connectionSettings = useSelector(getConnectionSettingsState);
  const hostIP = connectionSettings.ip;
  const hostPort = connectionSettings.apiPort;

  // Stream state
  const [streamActive, setStreamActive] = useState(false);
  const [streamUrl, setStreamUrl] = useState('');
  
  // UI state
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [ledEnabled, setLedEnabled] = useState(false);
  const [rotation180, setRotation180] = useState(false);
  const [developerMode, setDeveloperMode] = useState(false);
  
  // Calibration parameters
  const [stepSize, setStepSize] = useState(2000.0);
  const [gridRows, setGridRows] = useState(3);
  const [gridCols, setGridCols] = useState(3);
  const [startId, setStartId] = useState(0);
  const [pitchMm, setPitchMm] = useState(4.0);
  
  // Move to tag parameters
  const [targetTagId, setTargetTagId] = useState(0);
  const [roiTolerance, setRoiTolerance] = useState(8.0);
  const [maxIterations, setMaxIterations] = useState(30);
  const [maxStepUm, setMaxStepUm] = useState(1000.0);
  const [settleTime, setSettleTime] = useState(0.3);
  
  // Status and results
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Reference for MJPEG image
  const imgRef = useRef(null);

  // Set up stream URL
  useEffect(() => {
    if (hostIP && hostPort) {
      setStreamUrl(`${hostIP}:${hostPort}/PixelCalibrationController/overviewStream`);
    }
  }, [hostIP, hostPort]);

  // Handle stream start/stop
  const handleStreamToggle = async () => {
    try {
      setLoading(true);
      setError('');
      
      const newStreamState = !streamActive;
      
      if (newStreamState) {
        // Start stream - simply toggle state, img tag will connect automatically
        setStreamActive(true);
        setStatus('Stream started');
      } else {
        // Stop stream via API
        try {
          await apiPixelCalibrationControllerOverviewStream(false);
        } catch (err) {
          console.warn('Error stopping stream:', err);
        }
        setStreamActive(false);
        setStatus('Stream stopped');
      }
    } catch (err) {
      setError(`Failed to ${streamActive ? 'stop' : 'start'} stream: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Toggle AprilTag overlay
  const handleOverlayToggle = async (event) => {
    const enabled = event.target.checked;
    try {
      await apiPixelCalibrationControllerToggleAprilTagOverlay(enabled);
      setOverlayEnabled(enabled);
      setStatus(`AprilTag overlay ${enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      setError(`Failed to toggle overlay: ${err.message}`);
    }
  };

  // Toggle LED matrix
  const handleLedToggle = async (event) => {
    const enabled = event.target.checked;
    try {
      await apiLEDMatrixControllerSetAllLED(enabled ? 255 : 0);
      setLedEnabled(enabled);
      setStatus(`LED matrix ${enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      setError(`Failed to toggle LED: ${err.message}`);
    }
  };

  // Toggle 180° rotation
  const handleRotation180Toggle = async (event) => {
    const enabled = event.target.checked;
    try {
      await apiPixelCalibrationControllerGridSetRotation180(enabled);
      setRotation180(enabled);
      setStatus(`Grid rotation ${enabled ? 'enabled (180°)' : 'disabled'}`);
    } catch (err) {
      setError(`Failed to toggle rotation: ${err.message}`);
    }
  };

  // Set grid configuration
  const handleSetGridConfig = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiPixelCalibrationControllerGridSetConfig(
        gridRows, 
        gridCols, 
        startId, 
        pitchMm
      );
      
      setStatus('Grid configuration updated');
      setResult(response);
    } catch (err) {
      setError(`Failed to set grid config: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Identify axes
  const handleIdentifyAxes = async () => {
    try {
      setLoading(true);
      setError('');
      setStatus('Identifying axes... This may take a minute.');
      
      const response = await apiPixelCalibrationControllerOverviewIdentifyAxes(stepSize);
      
      setStatus('Axes identification complete');
      setResult(response);
    } catch (err) {
      setError(`Failed to identify axes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Detect tags
  const handleDetectTags = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiPixelCalibrationControllerGridDetectTags(false);
      
      setStatus('Tag detection complete');
      setResult(response);
    } catch (err) {
      setError(`Failed to detect tags: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Move to tag
  const handleMoveToTag = async () => {
    try {
      setLoading(true);
      setError('');
      setStatus(`Moving to tag ${targetTagId}...`);
      
      const response = await apiPixelCalibrationControllerGridMoveToTag({
        target_id: targetTagId,
        roi_tolerance_px: roiTolerance,
        max_iterations: maxIterations,
        max_step_um: maxStepUm,
        settle_time: settleTime
      });
      
      setStatus(`Successfully moved to tag ${targetTagId}`);
      setResult(response);
    } catch (err) {
      setError(`Failed to move to tag: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Left: Overview Camera Stream */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Overview Camera Stream
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Button 
                variant="contained" 
                onClick={handleStreamToggle}
                disabled={loading}
                sx={{ mr: 2 }}
              >
                {streamActive ? 'Stop Stream' : 'Start Stream'}
              </Button>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={overlayEnabled}
                    onChange={handleOverlayToggle}
                    disabled={!streamActive}
                  />
                }
                label="AprilTag Overlay"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={ledEnabled}
                    onChange={handleLedToggle}
                  />
                }
                label="LED Matrix"
              />
            </Box>

            {/* MJPEG Stream Display */}
            <Box 
              sx={{ 
                backgroundColor: 'black', 
                minHeight: 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              {streamActive ? (
                <img
                  ref={imgRef}
                  src={streamUrl}
                  alt="Overview Camera"
                  style={{ 
                    display: 'block',
                    margin: 'auto',
                    maxWidth: '100%', 
                    maxHeight: 500,
                    objectFit: 'contain',
                    WebkitUserSelect: 'none'
                  }}
                />
              ) : (
                <Typography color="white">
                  Stream not active. Click "Start Stream" to begin.
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right: Controls */}
        <Grid item xs={12} md={5}>
          {/* Status and Errors */}
          {status && (
            <Alert severity="info" sx={{ mb: 2 }} onClose={() => setStatus('')}>
              {status}
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Axis Identification */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Axis Identification
            </Typography>
            
            <TextField
              label="Step Size (µm)"
              type="number"
              value={stepSize}
              onChange={(e) => setStepSize(parseFloat(e.target.value))}
              fullWidth
              sx={{ mb: 2 }}
            />
            
            <Button 
              variant="contained" 
              onClick={handleIdentifyAxes}
              disabled={loading || !streamActive}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Identify Axes'}
            </Button>
            
            <FormControlLabel
              control={
                <Switch
                  checked={rotation180}
                  onChange={handleRotation180Toggle}
                />
              }
              label="Grid Rotated 180°"
              sx={{ mt: 1 }}
            />
          </Paper>

          {/* Grid Configuration (Developer Mode) */}
          <Accordion expanded={developerMode} onChange={() => setDeveloperMode(!developerMode)}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Developer Options</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Grid Configuration
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Rows"
                      type="number"
                      value={gridRows}
                      onChange={(e) => setGridRows(parseInt(e.target.value))}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Columns"
                      type="number"
                      value={gridCols}
                      onChange={(e) => setGridCols(parseInt(e.target.value))}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Start ID"
                      type="number"
                      value={startId}
                      onChange={(e) => setStartId(parseInt(e.target.value))}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Pitch (mm)"
                      type="number"
                      value={pitchMm}
                      onChange={(e) => setPitchMm(parseFloat(e.target.value))}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                </Grid>
                
                <Button 
                  variant="outlined" 
                  onClick={handleSetGridConfig}
                  disabled={loading}
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  Apply Grid Config
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Tag Detection */}
          <Paper sx={{ p: 2, my: 2 }}>
            <Typography variant="h6" gutterBottom>
              AprilTag Detection
            </Typography>
            
            <Button 
              variant="contained" 
              onClick={handleDetectTags}
              disabled={loading || !streamActive}
              fullWidth
            >
              Detect Tags
            </Button>
          </Paper>

          {/* Move to Tag */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Move to Tag
            </Typography>
            
            <TextField
              label="Target Tag ID"
              type="number"
              value={targetTagId}
              onChange={(e) => setTargetTagId(parseInt(e.target.value))}
              fullWidth
              sx={{ mb: 2 }}
            />
            
            {developerMode && (
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <TextField
                    label="ROI Tolerance (px)"
                    type="number"
                    value={roiTolerance}
                    onChange={(e) => setRoiTolerance(parseFloat(e.target.value))}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Max Iterations"
                    type="number"
                    value={maxIterations}
                    onChange={(e) => setMaxIterations(parseInt(e.target.value))}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Max Step (µm)"
                    type="number"
                    value={maxStepUm}
                    onChange={(e) => setMaxStepUm(parseFloat(e.target.value))}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Settle Time (s)"
                    type="number"
                    value={settleTime}
                    onChange={(e) => setSettleTime(parseFloat(e.target.value))}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>
            )}
            
            <Button 
              variant="contained" 
              onClick={handleMoveToTag}
              disabled={loading || !streamActive}
              fullWidth
            >
              Move to Tag
            </Button>
          </Paper>

          {/* Results Display */}
          {result && (
            <Paper sx={{ p: 2, mt: 2, backgroundColor: '#f5f5f5' }}>
              <Typography variant="h6" gutterBottom>
                Result
              </Typography>
              <pre style={{ fontSize: '0.85em', overflow: 'auto', maxHeight: 200 }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default TrackMotionTab;

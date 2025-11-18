import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Grid, 
  Paper,
  Alert,
  CircularProgress,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { useSelector } from 'react-redux';
import { getConnectionSettingsState } from '../../state/slices/ConnectionSettingsSlice';

import apiPixelCalibrationControllerCalibrateStageAffine from '../../backendapi/apiPixelCalibrationControllerCalibrateStageAffine';

/**
 * PixelCalibrationTab - Stage affine calibration
 * 
 * Features:
 * - Live detector stream view
 * - Stage affine calibration with configurable parameters
 * - Multiple objective support
 * - Pattern selection (cross, grid, etc.)
 * - Validation option
 */
const PixelCalibrationTab = () => {
  const connectionSettings = useSelector(getConnectionSettingsState);
  const hostIP = connectionSettings.ip;
  const hostPort = connectionSettings.apiPort;

  // Stream state
  const [streamUrl, setStreamUrl] = useState('');
  
  // Calibration parameters
  const [objectiveId, setObjectiveId] = useState(0);
  const [stepSizeUm, setStepSizeUm] = useState(100.0);
  const [pattern, setPattern] = useState('cross');
  const [nSteps, setNSteps] = useState(4);
  const [validate, setValidate] = useState(false);
  
  // Status and results
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Reference for live stream image
  const imgRef = useRef(null);

  // Set up stream URL for live view
  useEffect(() => {
    if (hostIP && hostPort) {
      // Use the main detector live stream
      setStreamUrl(`${hostIP}:${hostPort}/video_feeder`);
    }
  }, [hostIP, hostPort]);

  // Start calibration
  const handleCalibrateAffine = async () => {
    try {
      setLoading(true);
      setError('');
      setStatus('Starting stage affine calibration... This may take several minutes.');
      setResult(null);
      
      const response = await apiPixelCalibrationControllerCalibrateStageAffine({
        objectiveId,
        stepSizeUm,
        pattern,
        nSteps,
        validate
      });
      
      setStatus('Calibration complete!');
      setResult(response);
    } catch (err) {
      setError(`Calibration failed: ${err.message}`);
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Left: Live Detector Stream */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Detector Live Stream
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Monitor detector image during calibration process
            </Typography>

            {/* Live Stream Display */}
            <Box 
              sx={{ 
                backgroundColor: 'black', 
                minHeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <img
                ref={imgRef}
                src={streamUrl}
                alt="Detector Live Stream"
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: 600,
                  objectFit: 'contain'
                }}
                onError={() => {
                  // Stream might not be active
                }}
              />
            </Box>
            
            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
              Note: Live stream must be started from Live View tab
            </Typography>
          </Paper>
        </Grid>

        {/* Right: Calibration Controls */}
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

          {/* Calibration Parameters */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Affine Calibration
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Calibrate camera-to-stage coordinate transformation
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Objective ID</InputLabel>
              <Select
                value={objectiveId}
                label="Objective ID"
                onChange={(e) => setObjectiveId(e.target.value)}
              >
                <MenuItem value={0}>Objective 0 (Default)</MenuItem>
                <MenuItem value={1}>Objective 1</MenuItem>
                <MenuItem value={2}>Objective 2</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Step Size (µm)"
              type="number"
              value={stepSizeUm}
              onChange={(e) => setStepSizeUm(parseFloat(e.target.value))}
              fullWidth
              sx={{ mb: 2 }}
              helperText="Distance to move stage between calibration points"
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Pattern</InputLabel>
              <Select
                value={pattern}
                label="Pattern"
                onChange={(e) => setPattern(e.target.value)}
              >
                <MenuItem value="cross">Cross (4 points)</MenuItem>
                <MenuItem value="grid">Grid (NxN points)</MenuItem>
                <MenuItem value="star">Star</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Number of Steps"
              type="number"
              value={nSteps}
              onChange={(e) => setNSteps(parseInt(e.target.value))}
              fullWidth
              sx={{ mb: 2 }}
              helperText="Number of steps in each direction for grid pattern"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={validate}
                  onChange={(e) => setValidate(e.target.checked)}
                />
              }
              label="Run validation after calibration"
              sx={{ mb: 2 }}
            />

            <Button 
              variant="contained" 
              color="primary"
              onClick={handleCalibrateAffine}
              disabled={loading}
              fullWidth
              size="large"
            >
              {loading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Calibrating...
                </>
              ) : (
                'Start Calibration'
              )}
            </Button>
          </Paper>

          {/* Information Box */}
          <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f0f7ff' }}>
            <Typography variant="subtitle2" gutterBottom>
              Calibration Process
            </Typography>
            <Typography variant="body2">
              1. The stage will move in a defined pattern<br/>
              2. Images are captured at each position<br/>
              3. Feature matching determines pixel shifts<br/>
              4. Affine transformation matrix is computed<br/>
              5. Results are saved to configuration
            </Typography>
          </Paper>

          {/* Results Display */}
          {result && (
            <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
              <Typography variant="h6" gutterBottom>
                Calibration Results
              </Typography>
              
              {result.status && (
                <Alert severity={result.status === 'success' ? 'success' : 'warning'} sx={{ mb: 2 }}>
                  {result.message || result.status}
                </Alert>
              )}
              
              {result.affine_matrix && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Affine Matrix
                  </Typography>
                  <pre style={{ fontSize: '0.85em', overflow: 'auto', backgroundColor: 'white', padding: '8px', borderRadius: '4px' }}>
                    {JSON.stringify(result.affine_matrix, null, 2)}
                  </pre>
                </Box>
              )}
              
              {result.pixel_size && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">
                    Pixel Size: {result.pixel_size[0]?.toFixed(3)} × {result.pixel_size[1]?.toFixed(3)} µm
                  </Typography>
                </Box>
              )}
              
              {result.metrics && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Metrics
                  </Typography>
                  <pre style={{ fontSize: '0.85em', overflow: 'auto', maxHeight: 200, backgroundColor: 'white', padding: '8px', borderRadius: '4px' }}>
                    {JSON.stringify(result.metrics, null, 2)}
                  </pre>
                </Box>
              )}
              
              {/* Fallback: show raw result */}
              {!result.affine_matrix && !result.status && (
                <pre style={{ fontSize: '0.85em', overflow: 'auto', maxHeight: 300 }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default PixelCalibrationTab;

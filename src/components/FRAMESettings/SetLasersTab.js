import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Grid, 
  Paper,
  Alert,
  TextField,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { useSelector } from 'react-redux';
import { getConnectionSettingsState } from '../../state/slices/ConnectionSettingsSlice';

import IlluminationController from '../IlluminationController';
import apiLaserControllerSetLaserChannelIndex from '../../backendapi/apiLaserControllerSetLaserChannelIndex';
import apiLaserControllerGetLaserNames from '../../backendapi/apiLaserControllerGetLaserNames';
import apiLEDMatrixControllerSetAllLED from '../../backendapi/apiLEDMatrixControllerSetAllLED';

/**
 * SetLasersTab - Laser channel configuration and testing
 * 
 * Features:
 * - Laser control using IlluminationController sliders
 * - Live stream viewing during laser setup
 * - LED matrix control (turn off for laser testing)
 * - Laser channel index mapping
 */
const SetLasersTab = () => {
  const connectionSettings = useSelector(getConnectionSettingsState);
  const hostIP = connectionSettings.ip;
  const hostPort = connectionSettings.apiPort;

  // Stream state
  const [streamUrl, setStreamUrl] = useState('');
  const [streamActive, setStreamActive] = useState(false);
  const [ledEnabled, setLedEnabled] = useState(false);
  
  // Laser names and channel mapping
  const [availableLasers, setAvailableLasers] = useState([]);
  const [laserName, setLaserName] = useState('');
  const [channelIndex, setChannelIndex] = useState(0);
  
  // Status
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reference for live stream image
  const imgRef = useRef(null);

  // Fetch available laser names on mount
  useEffect(() => {
    const fetchLaserNames = async () => {
      try {
        setLoading(true);
        const names = await apiLaserControllerGetLaserNames();
        setAvailableLasers(names);
        
        // Set first laser as default if available
        if (names.length > 0 && !laserName) {
          setLaserName(names[0]);
        }
      } catch (err) {
        console.error('Failed to fetch laser names:', err);
        setError('Failed to load laser names');
      } finally {
        setLoading(false);
      }
    };
    
    if (hostIP && hostPort) {
      fetchLaserNames();
    }
  }, [hostIP, hostPort]);

  // Set up stream URL for live view (using LiveViewController MJPEG endpoint)
  useEffect(() => {
    if (hostIP && hostPort) {
      setStreamUrl(`${hostIP}:${hostPort}/LiveViewController/mjpeg_stream?startStream=true`);
    }
  }, [hostIP, hostPort]);

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

  // Set laser channel index
  const handleSetLaserChannel = async () => {
    try {
      if (!laserName.trim()) {
        setError('Please enter a laser name');
        return;
      }
      
      await apiLaserControllerSetLaserChannelIndex(laserName, channelIndex);
      setStatus(`Laser "${laserName}" mapped to channel ${channelIndex}`);
      setError('');
    } catch (err) {
      setError(`Failed to set laser channel: ${err.message}`);
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Left: Laser Controls */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Laser Control
            </Typography>
            
            {/* Illumination Controller (reusable component) */}
            <IlluminationController 
              hostIP={hostIP} 
              hostPort={hostPort}
            />
          </Paper>

          {/* LED Matrix Control */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              LED Matrix
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={ledEnabled}
                  onChange={handleLedToggle}
                />
              }
              label="Enable LED Matrix"
            />
            
            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
              Turn off LED matrix when testing lasers
            </Typography>
          </Paper>

          {/* Laser Channel Mapping */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Laser Channel Mapping
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Associate laser names with channel indices
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="laser-name-select-label">Laser Name</InputLabel>
              <Select
                labelId="laser-name-select-label"
                id="laser-name-select"
                value={laserName}
                label="Laser Name"
                onChange={(e) => setLaserName(e.target.value)}
                disabled={loading || availableLasers.length === 0}
              >
                {availableLasers.length > 0 ? (
                  availableLasers.map((name) => (
                    <MenuItem key={name} value={name}>
                      {name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="" disabled>
                    No lasers available
                  </MenuItem>
                )}
              </Select>
            </FormControl>
            
            <TextField
              label="Channel Index"
              type="number"
              value={channelIndex}
              onChange={(e) => setChannelIndex(parseInt(e.target.value) || 0)}
              fullWidth
              sx={{ mb: 2 }}
            />
            
            <Button 
              variant="contained" 
              onClick={handleSetLaserChannel}
              fullWidth
            >
              Set Laser Channel
            </Button>
          </Paper>

          {/* Status Messages */}
          {status && (
            <Alert severity="info" sx={{ mt: 2 }} onClose={() => setStatus('')}>
              {status}
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
        </Grid>

        {/* Right: Live Stream */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Live Stream (Detector)
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              View the detector image to verify laser illumination and channel mapping
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Button 
                variant="contained" 
                onClick={() => setStreamActive(!streamActive)}
                sx={{ mr: 2 }}
              >
                {streamActive ? 'Stop Stream' : 'Start Stream'}
              </Button>
            </Box>

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
              {streamActive ? (
                <img
                  ref={imgRef}
                  src={streamUrl}
                  alt="Live Detector Stream"
                  style={{ 
                    display: 'block',
                    margin: 'auto',
                    maxWidth: '100%', 
                    maxHeight: 600,
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
      </Grid>
    </Box>
  );
};

export default SetLasersTab;

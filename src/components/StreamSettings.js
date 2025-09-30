import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Box,
  Alert,
  Divider
} from '@mui/material';
import apiSettingsControllerGetStreamParams from '../backendapi/apiSettingsControllerGetStreamParams';
import apiSettingsControllerSetStreamParams from '../backendapi/apiSettingsControllerSetStreamParams';
import * as liveStreamSlice from '../state/slices/LiveStreamSlice.js';

/**
 * Stream Settings Panel - Runtime configuration for binary streaming
 * GET/POST /api/settings/getStreamParams and /api/settings/setStreamParams
 */
const StreamSettings = () => {
  const dispatch = useDispatch();
  
  const [settings, setSettings] = useState({
    binary: {
      enabled: true,
      compression: {
        algorithm: 'lz4',
        level: 0
      },
      subsampling: {
        factor: 1,
        auto_max_dim: 0
      },
      throttle_ms: 50,
      bitdepth_in: 12,
      pixfmt: 'GRAY16'
    },
    jpeg: {
      enabled: false
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatePending, setUpdatePending] = useState(false);
  const [isLegacyBackend, setIsLegacyBackend] = useState(false);

  // Debounced update function
  const debouncedUpdate = useCallback(
    debounce(async (newSettings) => {
      try {
        setUpdatePending(true);
        setError(null);
        
        // Only try to update binary settings if not in legacy mode
        if (!isLegacyBackend && newSettings.binary.enabled) {
          await apiSettingsControllerSetStreamParams({
            throttle_ms: newSettings.binary.throttle_ms,
            compression: newSettings.binary.compression,
            subsampling: newSettings.binary.subsampling
          });
        }
        
        console.log('Stream settings updated successfully');
      } catch (err) {
        console.warn('Binary streaming API failed, detecting legacy backend:', err.message);
        
        // Detect legacy backend by API failure
        if (!isLegacyBackend && (err.message.includes('404') || err.message.includes('Not Found') || err.message.includes('setStreamParams'))) {
          console.log('Legacy backend detected - switching to JPEG streaming');
          setIsLegacyBackend(true);
          
          // Dispatch to Redux for global state
          dispatch(liveStreamSlice.setIsLegacyBackend(true));
          
          // Automatically switch to JPEG streaming
          const legacySettings = {
            ...newSettings,
            binary: { ...newSettings.binary, enabled: false },
            jpeg: { ...newSettings.jpeg, enabled: true }
          };
          setSettings(legacySettings);
          
          setError('Legacy backend detected - automatically switched to JPEG streaming');
          return;
        }
        
        setError(`Failed to update settings: ${err.message}`);
      } finally {
        setUpdatePending(false);
      }
    }, 300),
    [isLegacyBackend, dispatch]
  );

  // Load initial settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to load binary streaming settings
        const params = await apiSettingsControllerGetStreamParams();
        setSettings(params);
        console.log('Binary streaming API available - using modern backend');
        
        // Dispatch to Redux that we have modern backend capabilities
        dispatch(liveStreamSlice.setIsLegacyBackend(false));
        dispatch(liveStreamSlice.setBackendCapabilities({
          binaryStreaming: true,
          webglSupported: true
        }));
      } catch (err) {
        console.warn('Failed to load binary streaming settings:', err.message);
        
        // Detect legacy backend
        if (err.message.includes('404') || err.message.includes('Not Found') || err.message.includes('getStreamParams')) {
          console.log('Legacy backend detected - using JPEG streaming defaults');
          setIsLegacyBackend(true);
          
          // Dispatch to Redux for global state
          dispatch(liveStreamSlice.setIsLegacyBackend(true));
          dispatch(liveStreamSlice.setBackendCapabilities({
            binaryStreaming: false,
            webglSupported: false
          }));
          
          // Set legacy default settings
          setSettings({
            binary: {
              enabled: false,
              compression: { algorithm: 'lz4', level: 0 },
              subsampling: { factor: 1, auto_max_dim: 0 },
              throttle_ms: 50,
              bitdepth_in: 12,
              pixfmt: 'GRAY16'
            },
            jpeg: {
              enabled: true
            }
          });
          
          setError('Legacy backend detected - using JPEG streaming');
        } else {
          setError(`Failed to load settings: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Handle setting changes with debounced updates
  const handleSettingChange = useCallback((path, value) => {
    const newSettings = { ...settings };
    
    // Navigate to the nested property and update it
    const keys = path.split('.');
    let current = newSettings;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setSettings(newSettings);
    debouncedUpdate(newSettings);
  }, [settings, debouncedUpdate]);

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography>Loading stream settings...</Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ 
      p: 2, 
      minWidth: 300, 
      maxHeight: 'calc(100vh - 100px)', 
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      <Typography variant="h6" gutterBottom>
        Stream Settings
        {updatePending && (
          <Typography component="span" sx={{ ml: 1, fontSize: '0.8em', color: 'text.secondary' }}>
            (updating...)
          </Typography>
        )}
      </Typography>
      
      {/* Legacy Backend Warning */}
      {isLegacyBackend && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold">Legacy Backend Detected</Typography>
          <Typography variant="body2">
            Your backend doesn't support binary streaming. Only JPEG streaming is available.
            Consider updating your backend for better performance.
          </Typography>
        </Alert>
      )}
      
      {/* Binary Stream Settings */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Binary Stream (16-bit)
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.binary.enabled}
              onChange={(e) => handleSettingChange('binary.enabled', e.target.checked)}
              disabled={isLegacyBackend}
            />
          }
          label={`Enable Binary Streaming${isLegacyBackend ? ' (Not Available)' : ''}`}
          sx={{ mb: 1 }}
        />
        
        {settings.binary.enabled && (
          <Box sx={{ ml: 2 }}>
            {/* Compression Settings */}
            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth sx={{ mb: 1 }}>
                <InputLabel>Compression Algorithm</InputLabel>
                <Select
                  value={settings.binary.compression.algorithm}
                  label="Compression Algorithm"
                  onChange={(e) => handleSettingChange('binary.compression.algorithm', e.target.value)}
                >
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="lz4">LZ4</MenuItem>
                  <MenuItem value="zstd">Zstandard</MenuItem>
                </Select>
              </FormControl>
              
              {settings.binary.compression.algorithm !== 'none' && (
                <TextField
                  fullWidth
                  type="number"
                  label="Compression Level"
                  value={settings.binary.compression.level}
                  onChange={(e) => handleSettingChange('binary.compression.level', parseInt(e.target.value) || 0)}
                  inputProps={{ min: 0, max: 9 }}
                  helperText="0 = fastest, 9 = best compression"
                />
              )}
            </Box>
            
            {/* Subsampling Settings */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>Subsampling</Typography>
              
              <TextField
                fullWidth
                type="number"
                label="Subsampling Factor"
                value={settings.binary.subsampling.factor}
                onChange={(e) => handleSettingChange('binary.subsampling.factor', parseInt(e.target.value) || 1)}
                inputProps={{ min: 1, max: 4 }}
                helperText="1 = full resolution, 2 = half, etc."
                sx={{ mb: 1 }}
              />
              
              <TextField
                fullWidth
                type="number"
                label="Auto Max Dimension"
                value={settings.binary.subsampling.auto_max_dim}
                onChange={(e) => handleSettingChange('binary.subsampling.auto_max_dim', parseInt(e.target.value) || 0)}
                inputProps={{ min: 0 }}
                helperText="0 = disabled, >0 = auto-subsample if larger"
              />
            </Box>
            
            {/* Throttle Settings */}
            <TextField
              fullWidth
              type="number"
              label="Throttle (ms)"
              value={settings.binary.throttle_ms}
              onChange={(e) => handleSettingChange('binary.throttle_ms', parseInt(e.target.value) || 50)}
              inputProps={{ min: 1, max: 1000 }}
              helperText="Minimum time between frames"
              sx={{ mb: 2 }}
            />
            
            {/* Read-only info */}
            <Box sx={{  p: 1, borderRadius: 1 }}>
              <Typography variant="body2">
                Bit Depth: {settings.binary.bitdepth_in}-bit
              </Typography>
              <Typography variant="body2">
                Pixel Format: {settings.binary.pixfmt}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* JPEG Stream Settings */}
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          JPEG Stream (Legacy)
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.jpeg.enabled}
              onChange={(e) => handleSettingChange('jpeg.enabled', e.target.checked)}
            />
          }
          label="Enable JPEG Streaming"
        />
        
        {settings.jpeg.enabled && (
          <Box sx={{ mt: 1 }}>
            <Alert severity="info" sx={{ mb: 1 }}>
              JPEG streaming is legacy. Use binary streaming for better quality and performance.
            </Alert>
            
            <TextField
              fullWidth
              type="number"
              label="Compression Quality"
              defaultValue={85}
              inputProps={{ min: 1, max: 100 }}
              helperText="1 = lowest quality/size, 100 = highest quality/size"
              sx={{ mb: 1 }}
            />
          </Box>
        )}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Paper>
  );
};

// Simple debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default StreamSettings;
import React, { useState, useEffect, useCallback } from 'react';
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

/**
 * Stream Settings Panel - Runtime configuration for binary streaming
 * GET/POST /api/settings/getStreamParams and /api/settings/setStreamParams
 */
const StreamSettings = () => {
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

  // Debounced update function
  const debouncedUpdate = useCallback(
    debounce(async (newSettings) => {
      try {
        setUpdatePending(true);
        setError(null);
        
        await apiSettingsControllerSetStreamParams({
          throttle_ms: newSettings.binary.throttle_ms,
          compression: newSettings.binary.compression,
          subsampling: newSettings.binary.subsampling
        });
        
        console.log('Stream settings updated successfully');
      } catch (err) {
        setError(`Failed to update settings: ${err.message}`);
      } finally {
        setUpdatePending(false);
      }
    }, 300),
    []
  );

  // Load initial settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = await apiSettingsControllerGetStreamParams();
        setSettings(params);
      } catch (err) {
        setError(`Failed to load settings: ${err.message}`);
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
    <Paper sx={{ p: 2, minWidth: 300 }}>
      <Typography variant="h6" gutterBottom>
        Stream Settings
        {updatePending && (
          <Typography component="span" sx={{ ml: 1, fontSize: '0.8em', color: 'text.secondary' }}>
            (updating...)
          </Typography>
        )}
      </Typography>
      
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
            />
          }
          label="Enable Binary Streaming"
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
            <Box sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
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
          <Alert severity="info" sx={{ mt: 1 }}>
            JPEG streaming is legacy. Use binary streaming for better quality and performance.
          </Alert>
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
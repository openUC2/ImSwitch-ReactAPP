import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  Divider,
  Button
} from '@mui/material';
import apiSettingsControllerGetStreamParams from '../backendapi/apiSettingsControllerGetStreamParams';
import apiSettingsControllerSetStreamParams from '../backendapi/apiSettingsControllerSetStreamParams';
import apiSettingsControllerSetJpegQuality from '../backendapi/apiSettingsControllerSetJpegQuality';
import * as liveStreamSlice from '../state/slices/LiveStreamSlice.js';

/**
 * Stream Settings Panel - Runtime configuration for binary streaming
 * GET/POST /api/settings/getStreamParams and /api/settings/setStreamParams
 */
const StreamSettings = ({ onOpen }) => {
  const dispatch = useDispatch();
  const liveStreamState = useSelector(liveStreamSlice.getLiveStreamState);
  
  const [settings, setSettings] = useState({
    binary: {
      enabled: true,
      compression: {
        algorithm: 'lz4',
        level: 0
      },
      subsampling: {
        factor: 5
            },
      throttle_ms: 50,
      bitdepth_in: 12,
      pixfmt: 'GRAY16'
    },
    jpeg: {
      enabled: false,
      quality: 85
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
        
        // Only try to update binary settings if not in legacy mode and binary is enabled
        if (!isLegacyBackend && newSettings.binary.enabled) {
          await apiSettingsControllerSetStreamParams({
            throttle_ms: newSettings.binary.throttle_ms,
            compression: newSettings.binary.compression,
            subsampling: newSettings.binary.subsampling
          });
        }
        
        // Update JPEG quality if JPEG is enabled
        if (newSettings.jpeg.enabled && newSettings.jpeg.quality !== undefined) {
          try {
            await apiSettingsControllerSetStreamParams({
              compression: { algorithm: 'jpeg', level: newSettings.jpeg.quality } // Dummy to ensure JPEG is set
            })
          } catch (err) {
            console.warn('Failed to set JPEG quality (backend may not support this endpoint):', err.message);
          }
        }
        
        // Update Redux to track current stream format
        const currentFormat = newSettings.binary.enabled ? 'binary' : 'jpeg';
        dispatch(liveStreamSlice.setImageFormat(currentFormat));
        
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
        
        // Set initial format based on enabled state
        const initialFormat = params.binary?.enabled ? 'binary' : 'jpeg';
        dispatch(liveStreamSlice.setImageFormat(initialFormat));
      } catch (err) {
        console.warn('Failed to load binary streaming settings:', err.message);
        
        // Handle timeout errors with retry option
        if (err.message.includes('timeout')) {
          setError('Failed to load settings: timeout exceeded. Click to retry.');
          setLoading(false);
          return;
        }
        
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
          
          // Set JPEG as default format
          dispatch(liveStreamSlice.setImageFormat('jpeg'));
          
          // Set legacy default settings
          setSettings({
            binary: {
              enabled: false,
              compression: { algorithm: 'lz4', level: 0 },
              subsampling: { factor: 4},
              throttle_ms: 50,
              bitdepth_in: 12,
              pixfmt: 'GRAY16'
            },
            jpeg: {
              enabled: true,
              quality: 85
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
  }, [dispatch]);

  // Reload settings when component becomes visible (for panels/menus that can be opened)
  useEffect(() => {
    if (onOpen) {
      const handleReload = async () => {
        try {
          const params = await apiSettingsControllerGetStreamParams();
          setSettings(params);
          setError(null);
        } catch (err) {
          console.warn('Failed to reload settings:', err.message);
        }
      };
      
      // Call reload when onOpen is triggered
      onOpen(handleReload);
    }
  }, [onOpen]);

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

  // Handle retry for timeout errors
  const handleRetry = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = await apiSettingsControllerGetStreamParams();
      setSettings(params);
      const initialFormat = params.binary?.enabled ? 'binary' : 'jpeg';
      dispatch(liveStreamSlice.setImageFormat(initialFormat));
    } catch (err) {
      setError(`Failed to load settings: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (error && error.includes('timeout')) {
    return (
      <Paper sx={{ p: 2 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={handleRetry}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
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
      
      {/* Stream Format Selector */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Stream Format
        </Typography>
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Stream Type</InputLabel>
          <Select
            value={settings.binary.enabled ? 'binary' : 'jpeg'}
            label="Stream Type"
            onChange={(e) => {
              const isBinary = e.target.value === 'binary';
              handleSettingChange('binary.enabled', isBinary);
              handleSettingChange('jpeg.enabled', !isBinary);
              
              // Update Redux to track format
              dispatch(liveStreamSlice.setImageFormat(isBinary ? 'binary' : 'jpeg'));
              
              // Auto-adjust min/max values when switching formats
              if (isBinary) {
                // Switch to binary: expand range to 16-bit if currently at 8-bit
                const currentMax = liveStreamState.maxVal || 0;
                if (currentMax <= 255) {
                  // Scale up from 8-bit to 16-bit
                  const newMax = Math.min(currentMax * 256, 65535);
                  dispatch(liveStreamSlice.setMaxVal(newMax));
                  dispatch(liveStreamSlice.setMinVal(liveStreamState.minVal * 256));
                }
              } else {
                // Switch to JPEG: compress range to 8-bit if currently at 16-bit
                const currentMax = liveStreamState.maxVal || 0;
                if (currentMax > 255) {
                  // Scale down from 16-bit to 8-bit
                  const newMax = Math.min(Math.floor(currentMax / 256), 255);
                  dispatch(liveStreamSlice.setMaxVal(newMax));
                  dispatch(liveStreamSlice.setMinVal(Math.floor(liveStreamState.minVal / 256)));
                }
              }
            }}
            disabled={isLegacyBackend}
          >
            <MenuItem value="binary">Binary (16-bit) - High Quality</MenuItem>
            <MenuItem value="jpeg">JPEG (8-bit) - Legacy</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* Binary Stream Settings */}
      {settings.binary.enabled && (
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Binary Stream Settings
        </Typography>
        
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
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}>
                Note: RGB binary streaming requires backend support
              </Typography>
            </Box>
          </Box>
      </Box>
      )}
      
      {/* JPEG Stream Settings */}
      {settings.jpeg.enabled && (
      <Box sx={{ mb: 2 }}>
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          JPEG Stream Settings
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          JPEG streaming provides 8-bit images. For scientific imaging with better dynamic range, 
          consider using binary streaming if your backend supports it.
        </Alert>
        
        <Box sx={{ ml: 2 }}>
          <TextField
            fullWidth
            type="number"
            label="Compression Quality"
            value={settings.jpeg.quality}
            onChange={(e) => handleSettingChange('jpeg.quality', parseInt(e.target.value) || 85)}
            inputProps={{ min: 1, max: 100 }}
            helperText="1 = lowest quality/size, 100 = highest quality/size"
            sx={{ mb: 1 }}
          />
        </Box>
      </Box>
      )}
      
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
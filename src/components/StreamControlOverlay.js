import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Slider,
  Button,
  Collapse,
  IconButton,
  Divider,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AutoMode as AutoModeIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { setMinVal, setMaxVal, setGamma, getLiveStreamState, setStreamSettings, setImageFormat } from '../state/slices/LiveStreamSlice.js';
import apiSettingsControllerSetStreamParams from '../backendapi/apiSettingsControllerSetStreamParams';

const StreamControlOverlay = ({ hostIP, hostPort, stats, featureSupport, isWebGL, imageSize, viewTransform }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const liveStreamState = useSelector(getLiveStreamState);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 = Controls, 1 = Settings, 2 = Info
  
  // Draft mode for settings
  const [draftSettings, setDraftSettings] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    imageFormat = 'binary',
    minVal = 0,
    maxVal = 32768,
    gamma = 1.0,
    streamSettings = {}
  } = liveStreamState || {};

  // Initialize draft settings from Redux state
  useEffect(() => {
    const initialSettings = JSON.parse(JSON.stringify(streamSettings || {}));
    // Ensure both binary and jpeg objects exist with proper defaults
    if (!initialSettings.binary) {
      initialSettings.binary = {
        enabled: true,
        compression: { algorithm: 'lz4', level: 0 },
        subsampling: { factor: 4 },
        throttle_ms: 100,
        bitdepth_in: 12,
        pixfmt: 'GRAY16'
      };
    }
    if (!initialSettings.jpeg) {
      initialSettings.jpeg = {
        enabled: false,
        quality: 85
      };
    }
    if (!initialSettings.current_compression_algorithm) {
      initialSettings.current_compression_algorithm = initialSettings.binary.enabled ? 'binary' : 'jpeg';
    }
    setDraftSettings(initialSettings);
  }, [streamSettings]);

  // Handle draft setting changes
  const handleDraftChange = useCallback((path, value) => {
    const newDraftSettings = JSON.parse(JSON.stringify(draftSettings));
    
    // Navigate to the nested property and update it
    const keys = path.split('.');
    let current = newDraftSettings;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setDraftSettings(newDraftSettings);
    setSubmitError(null);
    setSubmitSuccess(false);
  }, [draftSettings]);

  // Submit settings to backend
  const handleSubmitSettings = useCallback(async () => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      // Prepare parameters in the correct format for the API
      if (draftSettings.binary?.enabled) {
        // Binary streaming parameters
        await apiSettingsControllerSetStreamParams({
          throttle_ms: draftSettings.binary.throttle_ms,
          compression: draftSettings.binary.compression,
          subsampling: draftSettings.binary.subsampling
        });
      } else {
        // JPEG streaming - set compression to "jpeg"
        await apiSettingsControllerSetStreamParams({
          compression: { algorithm: 'jpeg', level: 0 }
        });
      }
      
      // Update Redux state only after successful backend submission
      dispatch(setStreamSettings(draftSettings));
      
      // Update image format in Redux
      const newFormat = draftSettings.binary?.enabled ? 'binary' : 'jpeg';
      dispatch(setImageFormat(newFormat));
      
      setSubmitSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
      
    } catch (err) {
      console.warn('Stream settings API failed:', err.message);
      
      // Detect legacy backend by API failure  
      if (err.message.includes('404') || err.message.includes('Not Found') || err.message.includes('setStreamParams')) {
        setSubmitError('Legacy backend detected - binary streaming not supported. Please use JPEG mode.');
      } else {
        setSubmitError(`Failed to submit settings: ${err.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [draftSettings, dispatch]);

  // Reset draft to current Redux state
  const handleResetSettings = useCallback(() => {
    setDraftSettings(JSON.parse(JSON.stringify(streamSettings || {})));
    setSubmitError(null);
    setSubmitSuccess(false);
  }, [streamSettings]);

  // Determine format and range based on imageFormat
  const isJpeg = imageFormat === 'jpeg';
  const formatLabel = isJpeg ? 'JPEG' : 'BINARY';
  const maxRange = isJpeg ? 255 : 32768;
  const rangeLabel = `0–${maxRange}`;

  // Auto contrast function
  const handleAutoContrast = () => {
    if (isJpeg) {
      dispatch(setMinVal(0));
      dispatch(setMaxVal(255));
    } else {
      dispatch(setMinVal(0));
      dispatch(setMaxVal(32768));
    }
  };

  return (
    <Paper 
      elevation={3}
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        width: isExpanded ? 400 : 60,
        height: isExpanded ? 'auto' : 60,
        maxHeight: isExpanded ? '85vh' : 60,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        zIndex: 1000,
        transition: 'all 0.3s ease-in-out',
        cursor: isExpanded ? 'default' : 'pointer',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
      onClick={!isExpanded ? () => setIsExpanded(true) : undefined}
    >
      {/* Header with Status Information */}
      <Box sx={{ 
        p: isExpanded ? 2 : 1.5, 
        pb: isExpanded ? 1 : 1.5,
        flexShrink: 0 // Prevent header from shrinking
      }}>
        {!isExpanded ? (
          // Collapsed state - only show info icon
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <InfoIcon sx={{ fontSize: 28, color: 'secondary.contrastText' }} />
          </Box>
        ) : (
          // Expanded state - full header
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <SettingsIcon sx={{ fontSize: 18 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Stream Control
              </Typography>
              <IconButton
                size="small"
                onClick={() => setIsExpanded(false)}
                sx={{ ml: 'auto' }}
              >
                <ExpandLessIcon />
              </IconButton>
            </Box>

            {/* Status Chips */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label={`Format: ${formatLabel}`} 
                size="small" 
                color={isJpeg ? 'primary' : 'secondary'}
              />
              <Chip 
                label={`Range: ${rangeLabel}`} 
                size="small" 
                variant="outlined"
              />
              <Chip 
                label={`Window: ${minVal}–${maxVal}`} 
                size="small" 
                color="info"
              />
            </Box>
            
            {/* Binary Stream Info */}
            {!isJpeg && draftSettings?.binary && (
              <Box sx={{ 
                mt: 1, 
                p: 1, 
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.05)' 
                  : 'rgba(0,0,0,0.05)', 
                borderRadius: 1 
              }}>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                  {draftSettings.binary.compression?.algorithm?.toUpperCase() || 'LZ4'} • 
                  Level {draftSettings.binary.compression?.level || 0} • 
                  {draftSettings.binary.subsampling?.factor || 4}x Sub • 
                  {draftSettings.binary.throttle_ms || 100}ms
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                  {draftSettings.binary.bitdepth_in || 12}-bit {draftSettings.binary.pixfmt || 'GRAY16'}
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Expandable Controls */}
      <Collapse in={isExpanded} sx={{ 
        overflow: 'hidden', 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: 0 // Important for proper flex behavior
      }}>
        <Divider sx={{ flexShrink: 0 }} />
        
        {/* Tabs */}
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            flexShrink: 0
          }}
        >
          <Tab label="Controls" />
          <Tab label="Settings" />
          <Tab label="Info" />
        </Tabs>
        
        {/* Scrollable Content Area */}
        <Box sx={{ 
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.3)' 
              : 'rgba(0,0,0,0.3)',
            borderRadius: 3,
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.5)' 
              : 'rgba(0,0,0,0.5)',
          },
        }}>
          {/* Controls Tab */}
          {activeTab === 0 && (
            <Box sx={{ p: 2, pt: 1 }}>
              {/* Window/Level Controls */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    Window/Level
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AutoModeIcon />}
                    onClick={handleAutoContrast}
                    sx={{ ml: 'auto', fontSize: '0.75rem', py: 0.25 }}
                  >
                    Auto
                  </Button>
                </Box>

                {/* Window Slider */}
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="textSecondary">
                    Window: {minVal}
                  </Typography>
                  <Slider
                    value={minVal || 0}
                    onChange={(_, value) => dispatch(setMinVal(value))}
                    min={0}
                    max={maxRange}
                    step={1}
                    valueLabelDisplay="auto"
                    size="small"
                  />
                </Box>

                {/* Level Slider */}
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="textSecondary">
                    Level: {maxVal}
                  </Typography>
                  <Slider
                    value={maxVal || maxRange}
                    onChange={(_, value) => dispatch(setMaxVal(value))}
                    min={0}
                    max={maxRange}
                    step={1}
                    valueLabelDisplay="auto"
                    size="small"
                  />
                </Box>
              </Box>

              {/* Gamma Control */}
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  Gamma: {gamma?.toFixed(2) || 1.0}
                </Typography>
                <Slider
                  value={gamma || 1.0}
                  onChange={(_, value) => dispatch(setGamma(value))}
                  min={0.1}
                  max={3.0}
                  step={0.1}
                  valueLabelDisplay="auto"
                  size="small"
                />
              </Box>
            </Box>
          )}

          {/* Settings Tab */}
          {activeTab === 1 && (
            <Box sx={{ p: 2, pt: 1 }}>
            <>
              {/* Stream Format Selection */}
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Stream Format</InputLabel>
                  <Select
                    value={draftSettings?.binary?.enabled === false ? 'jpeg' : 'binary'}
                    label="Stream Format"
                    onChange={(e) => {
                      const isBinary = e.target.value === 'binary';
                      const newDraftSettings = JSON.parse(JSON.stringify(draftSettings));
                      
                      // Ensure objects exist
                      if (!newDraftSettings.binary) newDraftSettings.binary = {};
                      if (!newDraftSettings.jpeg) newDraftSettings.jpeg = {};
                      
                      // Set the enabled states
                      newDraftSettings.binary.enabled = isBinary;
                      newDraftSettings.jpeg.enabled = !isBinary;
                      newDraftSettings.current_compression_algorithm = e.target.value;
                      
                      setDraftSettings(newDraftSettings);
                      setSubmitError(null);
                      setSubmitSuccess(false);
                    }}
                  >
                    <MenuItem value="jpeg">JPEG</MenuItem>
                    <MenuItem value="binary">Binary</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              {/* JPEG Quality (when JPEG is selected) */}
              {!draftSettings?.binary?.enabled && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    JPEG Quality: {draftSettings?.jpeg?.quality || 85}
                  </Typography>
                  <Slider
                    value={draftSettings?.jpeg?.quality || 85}
                    onChange={(_, value) => handleDraftChange('jpeg.quality', value)}
                    min={10}
                    max={100}
                    step={5}
                    valueLabelDisplay="auto"
                    size="small"
                  />
                </Box>
              )}
              
              {/* Binary Settings (when Binary is selected) */}
              {draftSettings?.binary?.enabled && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                    Binary Settings
                  </Typography>
                  
                  {/* Compression Algorithm */}
                  <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                    <InputLabel>Compression Algorithm</InputLabel>
                    <Select
                      value={draftSettings?.binary?.compression?.algorithm || 'lz4'}
                      label="Compression Algorithm"
                      onChange={(e) => handleDraftChange('binary.compression.algorithm', e.target.value)}
                    >
                      <MenuItem value="lz4">LZ4</MenuItem>
                      <MenuItem value="zstd">ZSTD</MenuItem>
                      <MenuItem value="none">None</MenuItem>
                    </Select>
                  </FormControl>
                  
                  {/* Compression Level */}
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Compression Level: {draftSettings?.binary?.compression?.level || 0}
                    </Typography>
                    <Slider
                      value={draftSettings?.binary?.compression?.level || 0}
                      onChange={(_, value) => handleDraftChange('binary.compression.level', value)}
                      min={0}
                      max={9}
                      step={1}
                      valueLabelDisplay="auto"
                      size="small"
                    />
                  </Box>
                  
                  {/* Subsampling Factor */}
                  <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                    <InputLabel>Subsampling Factor</InputLabel>
                    <Select
                      value={draftSettings?.binary?.subsampling?.factor || 4}
                      label="Subsampling Factor"
                      onChange={(e) => handleDraftChange('binary.subsampling.factor', parseInt(e.target.value))}
                    >
                      <MenuItem value={1}>1x (No subsampling)</MenuItem>
                      <MenuItem value={2}>2x</MenuItem>
                      <MenuItem value={4}>4x</MenuItem>
                      <MenuItem value={8}>8x</MenuItem>
                    </Select>
                  </FormControl>
                  
                  {/* Throttle Time */}
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Throttle: {draftSettings?.binary?.throttle_ms || 100}ms
                    </Typography>
                    <Slider
                      value={draftSettings?.binary?.throttle_ms || 100}
                      onChange={(_, value) => handleDraftChange('binary.throttle_ms', value)}
                      min={50}
                      max={1000}
                      step={50}
                      valueLabelDisplay="auto"
                      size="small"
                    />
                  </Box>
                  
                  {/* Bit Depth */}
                  <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                    <InputLabel>Bit Depth</InputLabel>
                    <Select
                      value={draftSettings?.binary?.bitdepth_in || 12}
                      label="Bit Depth"
                      onChange={(e) => handleDraftChange('binary.bitdepth_in', parseInt(e.target.value))}
                    >
                      <MenuItem value={8}>8-bit</MenuItem>
                      <MenuItem value={12}>12-bit</MenuItem>
                      <MenuItem value={16}>16-bit</MenuItem>
                    </Select>
                  </FormControl>
                  
                  {/* Pixel Format */}
                  <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                    <InputLabel>Pixel Format</InputLabel>
                    <Select
                      value={draftSettings?.binary?.pixfmt || 'GRAY16'}
                      label="Pixel Format"
                      onChange={(e) => handleDraftChange('binary.pixfmt', e.target.value)}
                    >
                      <MenuItem value="GRAY8">GRAY8</MenuItem>
                      <MenuItem value="GRAY16">GRAY16</MenuItem>
                      <MenuItem value="RGB24">RGB24</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}
              
              {/* Submit/Reset Buttons */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={isSubmitting ? <CircularProgress size={16} /> : <SaveIcon />}
                  onClick={handleSubmitSettings}
                  sx={{ flex: 1 }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={handleResetSettings}
                  sx={{ flex: 1 }}
                >
                  Reset
                </Button>
              </Box>
              
              {/* Status Messages */}
              {submitError && (
                <Alert severity="error" sx={{ mb: 1, fontSize: '0.75rem' }}>
                  {submitError}
                </Alert>
              )}
              {submitSuccess && (
                <Alert severity="success" sx={{ mb: 1, fontSize: '0.75rem' }}>
                  Settings submitted successfully!
                </Alert>
              )}
            </Box>
          )}

          {/* Info Tab */}
          {activeTab === 2 && (
            <Box sx={{ p: 2, pt: 1 }}>
              {/* Stream Performance Info */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                  Performance
                </Typography>
                <Box sx={{ p: 1, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                    {isWebGL ? 'WebGL2' : 'Canvas2D'} | {featureSupport?.lz4 ? 'LZ4' : 'No LZ4'}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                    FPS: {stats?.fps || 0} | {((stats?.bps || 0) / 1000000).toFixed(1)} Mbps
                  </Typography>
                </Box>
              </Box>
              
              {/* Image Info */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                  Image
                </Typography>
                <Box sx={{ p: 1, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                    Resolution: {imageSize?.width || 0}x{imageSize?.height || 0}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                    Zoom: {(viewTransform?.scale || 1).toFixed(2)}x
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                    Pan: X={((viewTransform?.translateX || 0)).toFixed(0)}, Y={((viewTransform?.translateY || 0)).toFixed(0)}
                  </Typography>
                </Box>
              </Box>
              
              {/* Backend Info */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                  Backend
                </Typography>
                <Box sx={{ p: 1, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                    Host: {hostIP}:{hostPort}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                    Legacy: {liveStreamState.isLegacyBackend ? 'Yes' : 'No'}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                    Binary Support: {liveStreamState.backendCapabilities.binaryStreaming ? 'Yes' : 'No'}
                  </Typography>
                </Box>
              </Box>

              {/* Stream Info */}
              {streamSettings && (
                <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                  <Typography variant="caption" color="textSecondary">
                    Quality: {streamSettings.quality || 'N/A'} | 
                    FPS: {streamSettings.fps || 'N/A'}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default StreamControlOverlay;

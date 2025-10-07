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
    minVal = 0,
    maxVal = 255,
    gamma = 1.0,
    currentImageFormat,
    streamSettings
  } = liveStreamState;

  // Determine if we're in JPEG mode
  const isJpeg = currentImageFormat === 'jpeg';
  const maxRange = isJpeg ? 255 : 65535;
  const formatLabel = isJpeg ? 'JPEG' : 'Binary';
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

  // Settings handlers
  const handleSubmitSettings = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // Apply format change
      const newFormat = draftSettings.binary?.enabled ? 'binary' : 'jpeg';
      dispatch(setImageFormat(newFormat));

      // Submit to backend
      await apiSettingsControllerSetStreamParams({
        hostIP,
        hostPort,
        streamParams: draftSettings
      });

      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      setSubmitError(error.message || 'Failed to submit settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSettings = () => {
    setDraftSettings({});
    setSubmitError(null);
    setSubmitSuccess(false);
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
        flexShrink: 0
      }}>
        {!isExpanded ? (
          <SettingsIcon sx={{ color: 'primary.main' }} />
        ) : (
          <>
            {/* Header Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                Stream Controls
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
          </>
        )}
      </Box>

      {/* Expandable Controls */}
      <Collapse in={isExpanded} sx={{ 
        overflow: 'hidden', 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: 0
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
            <Box sx={{ p: 2 }}>
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
                <Box sx={{ mb: 2 }}>
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
                <Box sx={{ mb: 2 }}>
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

                {/* Gamma Slider - if applicable */}
                {!isJpeg && (
                  <Box sx={{ mb: 2 }}>
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
                )}
              </Box>
            </Box>
          )}

          {/* Settings Tab */}
          {activeTab === 1 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 'medium' }}>
                Stream Settings
              </Typography>

              {/* Format Toggle */}
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!draftSettings?.binary?.enabled}
                      onChange={(e) => setDraftSettings(prev => ({
                        ...prev,
                        binary: { ...prev.binary, enabled: !e.target.checked }
                      }))}
                    />
                  }
                  label="JPEG Mode"
                />
              </Box>

              {/* Binary Stream Settings */}
              {draftSettings?.binary?.enabled && (
                <Box sx={{ mb: 3 }}>
                  <FormControl fullWidth sx={{ mb: 2 }} size="small">
                    <InputLabel>Compression</InputLabel>
                    <Select
                      value={draftSettings.binary?.compression?.algorithm || 'lz4'}
                      onChange={(e) => setDraftSettings(prev => ({
                        ...prev,
                        binary: {
                          ...prev.binary,
                          compression: { ...prev.binary?.compression, algorithm: e.target.value }
                        }
                      }))}
                    >
                      <MenuItem value="lz4">LZ4</MenuItem>
                      <MenuItem value="zstd">Zstandard</MenuItem>
                      <MenuItem value="none">None</MenuItem>
                    </Select>
                  </FormControl>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                      Compression Level: {draftSettings.binary?.compression?.level || 0}
                    </Typography>
                    <Slider
                      value={draftSettings.binary?.compression?.level || 0}
                      onChange={(_, value) => setDraftSettings(prev => ({
                        ...prev,
                        binary: {
                          ...prev.binary,
                          compression: { ...prev.binary?.compression, level: value }
                        }
                      }))}
                      min={0}
                      max={9}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                      size="small"
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                      Subsampling: {draftSettings.binary?.subsampling?.factor || 4}x
                    </Typography>
                    <Slider
                      value={draftSettings.binary?.subsampling?.factor || 4}
                      onChange={(_, value) => setDraftSettings(prev => ({
                        ...prev,
                        binary: {
                          ...prev.binary,
                          subsampling: { ...prev.binary?.subsampling, factor: value }
                        }
                      }))}
                      min={1}
                      max={8}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                      size="small"
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                      Throttle: {draftSettings.binary?.throttle_ms || 100}ms
                    </Typography>
                    <Slider
                      value={draftSettings.binary?.throttle_ms || 100}
                      onChange={(_, value) => setDraftSettings(prev => ({
                        ...prev,
                        binary: { ...prev.binary, throttle_ms: value }
                      }))}
                      min={16}
                      max={1000}
                      step={16}
                      valueLabelDisplay="auto"
                      size="small"
                    />
                  </Box>
                </Box>
              )}

              {/* Submit Button */}
              <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSubmitSettings}
                  disabled={isSubmitting}
                  size="small"
                  sx={{ flex: 1 }}
                >
                  {isSubmitting ? <CircularProgress size={16} /> : 'Submit'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleResetSettings}
                  size="small"
                >
                  Reset
                </Button>
              </Box>

              {/* Status Messages */}
              {submitError && (
                <Alert severity="error" sx={{ mt: 1 }} onClose={() => setSubmitError(null)}>
                  {submitError}
                </Alert>
              )}
              
              {submitSuccess && (
                <Alert severity="success" sx={{ mt: 1 }} onClose={() => setSubmitSuccess(false)}>
                  Settings submitted successfully!
                </Alert>
              )}
            </Box>
          )}

          {/* Info Tab */}
          {activeTab === 2 && (
            <Box sx={{ p: 2 }}>
              {/* Stream Performance Info */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                  Performance
                </Typography>
                <Box sx={{ 
                  p: 1, 
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.05)' 
                    : 'rgba(0,0,0,0.05)', 
                  borderRadius: 1 
                }}>
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
                <Box sx={{ 
                  p: 1, 
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.05)' 
                    : 'rgba(0,0,0,0.05)', 
                  borderRadius: 1 
                }}>
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
                <Box sx={{ 
                  p: 1, 
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.05)' 
                    : 'rgba(0,0,0,0.05)', 
                  borderRadius: 1 
                }}>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                    Host: {hostIP}:{hostPort}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                    Legacy: {liveStreamState.isLegacyBackend ? 'Yes' : 'No'}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                    Binary Support: {liveStreamState.backendCapabilities?.binaryStreaming ? 'Yes' : 'No'}
                  </Typography>
                </Box>
              </Box>

              {/* Stream Info */}
              {streamSettings && (
                <Box sx={{ 
                  mt: 2, 
                  pt: 1, 
                  borderTop: `1px solid ${theme.palette.divider}` 
                }}>
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
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import apiSettingsControllerGetDetectorGlobalParameters from '../backendapi/apiSettingsControllerGetDetectorGlobalParameters';
import * as connectionSettingsSlice from "../state/slices/ConnectionSettingsSlice.js";


    
const StreamControlOverlay = ({ stats, featureSupport, isWebGL, imageSize, viewTransform }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const liveStreamState = useSelector(getLiveStreamState);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 = Controls, 1 = Settings, 2 = Info
  
  const connectionSettingsState = useSelector(connectionSettingsSlice.getConnectionSettingsState);

  // Destructure liveStreamState FIRST before using its values
  const {
    minVal = 0,
    maxVal = 255,
    gamma = 1.0,
    currentImageFormat,
    streamSettings
  } = liveStreamState;

  // Draft mode for settings - initialize from Redux streamSettings
  const [draftSettings, setDraftSettings] = useState(streamSettings || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Determine if we're in JPEG mode
  const isJpeg = currentImageFormat === 'jpeg';
  const maxRange = isJpeg ? 255 : 65535;
  const formatLabel = isJpeg ? 'JPEG' : 'Binary';
  const rangeLabel = `0–${maxRange}`;
  
  // Get current frame ID from stats
  const currentFrameId = liveStreamState?.stats?.currentFrameId;

  // Load settings from backend on mount - use a ref to track if already loaded
  const hasLoadedSettings = useRef(false);
  
  useEffect(() => {
    // Only load once on mount
    if (hasLoadedSettings.current) return;
    
    const loadBackendSettings = async () => {
      try {
        const globalParams = await apiSettingsControllerGetDetectorGlobalParameters();
        console.log('Global detector parameters:', globalParams);
        
        // Determine stream type from compression algorithm
        // If algorithm is "jpeg", it's JPEG mode; otherwise (lz4, zstd, etc.) it's binary
        const isBinaryMode = globalParams.stream_compression_algorithm !== 'jpeg';
        
        const loadedSettings = {
          binary: {
            enabled: isBinaryMode,
            compression: {
              algorithm: isBinaryMode ? globalParams.stream_compression_algorithm : 'lz4',
              level: globalParams.compressionlevel || 0
            },
            subsampling: { factor: 4 },
            throttle_ms: 100
          },
          jpeg: {
            enabled: !isBinaryMode,
            quality: !isBinaryMode ? globalParams.compressionlevel : 85
          }
        };
        
        setDraftSettings(loadedSettings);
        hasLoadedSettings.current = true;
      } catch (error) {
        console.warn('Failed to load backend settings:', error);
        // Use Redux state as fallback
        setDraftSettings(streamSettings);
        hasLoadedSettings.current = true;
      }
    };
    
    loadBackendSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only load on mount, not when streamSettings changes

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
      // Determine the format and prepare parameters
      const isJpegMode = draftSettings.jpeg?.enabled === true;
      const newFormat = isJpegMode ? 'jpeg' : 'binary';
      
      // Prepare parameters for backend
      let submitParams = {};
      
      if (isJpegMode) {
        // JPEG mode: send compression with algorithm='jpeg' and level=quality
        submitParams = {
          binary: {
            enabled: false,
            compression: {
              algorithm: 'jpeg',
              level: draftSettings.jpeg?.quality || 85
            },
            subsampling: { factor: 1 },
            throttle_ms: 100
          },
          jpeg: {
            enabled: true,
            quality: draftSettings.jpeg?.quality || 85
          }
        };
      } else {
        // Binary mode: send normal binary compression params
        submitParams = draftSettings;
      }
      
      console.log('submitParams to be sent:', submitParams);
      
      // Update Redux with new format FIRST so LiveViewerGL can switch
      dispatch(setImageFormat(newFormat));
      dispatch(setStreamSettings(submitParams));
      
      // Update backend capabilities based on mode
      dispatch({ 
        type: 'liveStreamState/setBackendCapabilities', 
        payload: { 
          binaryStreaming: !isJpegMode,
          webglSupported: !isJpegMode
        } 
      });

      // Submit to backend
      await apiSettingsControllerSetStreamParams(submitParams);
      

      // Update draft settings with submitted values so they persist in UI
      setDraftSettings(submitParams);
      

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
        height: isExpanded ? '85vh' : 60,     // fixed height when expanded
        maxHeight: '90vh',
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
      {/* Header */}
      <Box sx={{ p: isExpanded ? 2 : 1.5, pb: isExpanded ? 1 : 1.5, flexShrink: 0 }}>
        {!isExpanded ? (
          <SettingsIcon sx={{ color: 'primary.main' }} />
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                Stream Controls
              </Typography>
              <IconButton size="small" onClick={() => setIsExpanded(false)} sx={{ ml: 'auto' }}>
                <ExpandLessIcon />
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={`Format: ${formatLabel}`} size="small" color={isJpeg ? 'primary' : 'secondary'} />
              <Chip label={`Range: ${rangeLabel}`} size="small" variant="outlined" />
              <Chip label={`Window: ${minVal}–${maxVal}`} size="small" color="info" />
              {currentFrameId !== null && currentFrameId !== undefined && (
                <Chip label={`Frame: ${currentFrameId}`} size="small" color="success" />
              )}
            </Box>
          </>
        )}
      </Box>

      {/* Body */}
      <Collapse in={isExpanded} sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <Divider sx={{ flexShrink: 0 }} />

          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}
          >
            <Tab label="Controls" />
            <Tab label="Settings" />
            <Tab label="Info" />
          </Tabs>

          {/* Scrollable content */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              '&::-webkit-scrollbar': { width: 6 },
              '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                borderRadius: 3
              },
              '&::-webkit-scrollbar-thumb:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
              }
            }}
          >
            {/* Controls Tab */}
            {activeTab === 0 && (
              <Box sx={{ p: 2 }}>
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
              <Box sx={{ p: 2, pb: 0 }}>
                <Typography variant="body2" sx={{ mb: 2, fontWeight: 'medium' }}>
                  Stream Settings
                </Typography>

                {/* Stream Format Dropdown */}
                <Box sx={{ mb: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Stream Format</InputLabel>
                    <Select
                      value={draftSettings?.jpeg?.enabled ? 'jpeg' : 'binary'}
                      label="Stream Format"
                      onChange={(e) => {
                        const isJpeg = e.target.value === 'jpeg';
                        setDraftSettings((prev) => ({
                          ...prev,
                          binary: { ...prev?.binary, enabled: !isJpeg },
                          jpeg: { ...prev?.jpeg, enabled: isJpeg }
                        }));
                      }}
                    >
                      <MenuItem value="binary">Binary (16-bit) - High Quality</MenuItem>
                      <MenuItem value="jpeg">JPEG (8-bit) - Legacy</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                    Current: {draftSettings?.binary?.enabled ? 'Binary' : 'JPEG'}
                  </Typography>
                </Box>

                {/* Binary Settings */}
                {draftSettings?.binary?.enabled && (
                  <Box sx={{ mb: 3 }}>
                    <FormControl fullWidth sx={{ mb: 2 }} size="small">
                      <InputLabel>Compression</InputLabel>
                      <Select
                        value={draftSettings.binary?.compression?.algorithm || 'lz4'}
                        label="Compression"
                        onChange={(e) =>
                          setDraftSettings((prev) => ({
                            ...prev,
                            binary: {
                              ...prev.binary,
                              compression: { ...prev.binary?.compression, algorithm: e.target.value }
                            }
                          }))
                        }
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
                        onChange={(_, value) =>
                          setDraftSettings((prev) => ({
                            ...prev,
                            binary: {
                              ...prev.binary,
                              compression: { ...prev.binary?.compression, level: value }
                            }
                          }))
                        }
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
                        onChange={(_, value) =>
                          setDraftSettings((prev) => ({
                            ...prev,
                            binary: {
                              ...prev.binary,
                              subsampling: { ...prev.binary?.subsampling, factor: value }
                            }
                          }))
                        }
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
                        onChange={(_, value) =>
                          setDraftSettings((prev) => ({
                            ...prev,
                            binary: { ...prev.binary, throttle_ms: value }
                          }))
                        }
                        min={16}
                        max={1000}
                        step={16}
                        valueLabelDisplay="auto"
                        size="small"
                      />
                    </Box>
                  </Box>
                )}

                {/* JPEG Settings */}
                {draftSettings?.jpeg?.enabled && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ mb: 2, fontWeight: 'medium' }}>
                      JPEG Settings
                    </Typography>
                    
                    <Alert severity="info" sx={{ mb: 2 }}>
                      JPEG mode provides 8-bit images. Quality setting affects compression ratio.
                    </Alert>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                        Quality: {draftSettings.jpeg?.quality || 85}%
                      </Typography>
                      <Slider
                        value={draftSettings.jpeg?.quality || 85}
                        onChange={(_, value) =>
                          setDraftSettings((prev) => ({
                            ...prev,
                            jpeg: { ...prev.jpeg, quality: value }
                          }))
                        }
                        min={1}
                        max={100}
                        step={5}
                        marks={[
                          { value: 1, label: 'Low' },
                          { value: 50, label: 'Medium' },
                          { value: 100, label: 'High' }
                        ]}
                        valueLabelDisplay="auto"
                        size="small"
                      />
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                        Lower quality = smaller files, faster streaming
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Sticky actions */}
                <Box
                  sx={{
                    position: 'sticky',
                    bottom: 0,
                    pt: 1,
                    pb: 1,
                    mt: 3,
                    backgroundColor: theme.palette.background.paper,
                    borderTop: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    gap: 1,
                    zIndex: 1
                  }}
                >
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
                  <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleResetSettings} size="small">
                    Reset
                  </Button>
                </Box>

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
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                    Performance
                  </Typography>
                  <Box
                    sx={{
                      p: 1,
                      backgroundColor:
                        theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      {isWebGL ? 'WebGL2' : 'Canvas2D'} | {featureSupport?.lz4 ? 'LZ4' : 'No LZ4'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      FPS: {stats?.fps || 0} | {((stats?.bps || 0) / 1000000).toFixed(1)} Mbps
                    </Typography>
                    {currentFrameId !== null && currentFrameId !== undefined && (
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                        Frame ID: {currentFrameId}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                    Image
                  </Typography>
                  <Box
                    sx={{
                      p: 1,
                      backgroundColor:
                        theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      Resolution: {imageSize?.width || 0}x{imageSize?.height || 0}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      Zoom: {(viewTransform?.scale || 1).toFixed(2)}x
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      Pan: X={(viewTransform?.translateX || 0).toFixed(0)}, Y={(viewTransform?.translateY || 0).toFixed(0)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                    Backend
                  </Typography>
                  <Box
                    sx={{
                      p: 1,
                      backgroundColor:
                        theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      Host: {connectionSettingsState.ip}:{connectionSettingsState.apiPort}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      Legacy: {liveStreamState.isLegacyBackend ? 'Yes' : 'No'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      Binary Support: {liveStreamState.backendCapabilities?.binaryStreaming ? 'Yes' : 'No'}
                    </Typography>
                  </Box>
                </Box>

                {streamSettings && (
                  <Box sx={{ mt: 2, pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="caption" color="textSecondary">
                      Quality: {streamSettings.quality || 'N/A'} | FPS: {streamSettings.fps || 'N/A'}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default StreamControlOverlay;
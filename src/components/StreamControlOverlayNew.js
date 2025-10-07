import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  IconButton,
  Paper,
  Slider,
  Typography,
  Button,
  Collapse,
  Chip
} from '@mui/material';
import {
  Settings as SettingsIcon
} from '@mui/icons-material';
import StreamSettings from './StreamSettings';
import StreamControls from './StreamControls';
import * as liveStreamSlice from '../state/slices/LiveStreamSlice.js';

/**
 * StreamControlOverlay - Shows stream status and provides access to settings
 * Replaces the bottom slider controls with overlay-based controls
 */
const StreamControlOverlay = ({ hostIP, hostPort }) => {
  const dispatch = useDispatch();
  const liveStreamState = useSelector(liveStreamSlice.getLiveStreamState);
  
  const [showSettings, setShowSettings] = useState(false);
  const [isStreamRunning, setIsStreamRunning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [snapFileName, setSnapFileName] = useState('snapshot');
  const [lastSnapPath, setLastSnapPath] = useState(null);
  const [showWindowLevel, setShowWindowLevel] = useState(false);

  // Stream control handlers
  const handleToggleStream = () => {
    setIsStreamRunning(!isStreamRunning);
    // TODO: Implement actual stream toggle API calls
  };

  const handleSnap = () => {
    // TODO: Implement snap functionality
    console.log(`Taking snapshot: ${snapFileName}`);
    setLastSnapPath(`/path/to/${snapFileName}.jpg`);
  };

  const handleStartRecord = () => {
    setIsRecording(true);
    // TODO: Implement recording start
  };

  const handleStopRecord = () => {
    setIsRecording(false);
    // TODO: Implement recording stop
  };

  const handleGoToImage = () => {
    // TODO: Implement navigation to last image
    console.log(`Navigate to: ${lastSnapPath}`);
  };

  // Calculate max value based on current format
  const getMaxValue = () => {
    if (liveStreamState.imageFormat === "jpeg") {
      return 255; // 8-bit JPEG
    } else if (liveStreamState.imageFormat === "binary") {
      return 65535; // Full 16-bit binary streaming
    } else {
      return 32768; // Conservative default
    }
  };

  // Get range display based on format
  const getRangeDisplay = () => {
    if (liveStreamState.imageFormat === 'jpeg') {
      return '0–255';
    } else if (liveStreamState.imageFormat === 'binary') {
      return `0–${liveStreamState.maxVal || 65535}`;
    } else {
      return `${liveStreamState.minVal || 0}–${liveStreamState.maxVal || 32768}`;
    }
  };
  
  const handleAutoContrast = () => {
    fetch(`${hostIP}:${hostPort}/HistogrammController/minmaxvalues`)
      .then(r => r.json())
      .then(d => {
        if (d.minVal !== undefined && d.maxVal !== undefined) {
          dispatch(liveStreamSlice.setMinVal(d.minVal));
          dispatch(liveStreamSlice.setMaxVal(d.maxVal));
        }
      })
      .catch(err => console.warn('Auto contrast failed:', err));
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 10,
        opacity: 0.9,
        '&:hover': { opacity: 1 },
        maxWidth: showSettings ? '400px' : '350px',
        transition: 'all 0.3s ease-in-out'
      }}
    >
      <Paper sx={{ p: 2 }}>
        {/* Stream Status Display */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Live Stream
          </Typography>
          <IconButton 
            size="small" 
            onClick={() => setShowSettings(!showSettings)}
            sx={{ 
              transform: showSettings ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }}
          >
            <SettingsIcon />
          </IconButton>
        </Box>

        {/* Current Stream Status - Shows actual state from Redux */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={`Format: ${(liveStreamState.imageFormat || 'UNKNOWN').toUpperCase()}`}
            size="small"
            color={liveStreamState.imageFormat === 'binary' ? 'primary' : 'default'}
          />
          <Chip 
            label={`Range: ${getRangeDisplay()}`}
            size="small"
            variant="outlined"
          />
          <Chip 
            label={`Window: ${liveStreamState.minVal}–${liveStreamState.maxVal}`}
            size="small"
            color="secondary"
          />
        </Box>

        {/* Window/Level Controls Button */}
        <Button 
          variant="outlined" 
          onClick={() => setShowWindowLevel(!showWindowLevel)}
          sx={{ mb: 1, mr: 1 }}
          size="small"
        >
          Window/Level Controls
        </Button>

        {/* Auto Contrast Button */}
        <Button 
          variant="outlined" 
          onClick={handleAutoContrast}
          sx={{ mb: 1 }}
          size="small"
        >
          Auto Contrast
        </Button>

        {/* Window/Level Controls */}
        <Collapse in={showWindowLevel}>
          <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="body2" gutterBottom>
              Manual Window/Level: {liveStreamState.minVal} - {liveStreamState.maxVal}
            </Typography>
            <Slider
              value={[liveStreamState.minVal, liveStreamState.maxVal]}
              onChange={(_, value) => {
                dispatch(liveStreamSlice.setMinVal(value[0]));
                dispatch(liveStreamSlice.setMaxVal(value[1]));
              }}
              valueLabelDisplay="auto"
              min={0}
              max={getMaxValue()}
              step={1}
              sx={{ mb: 1 }}
            />
            
            {/* Gamma Slider */}
            <Typography variant="body2" gutterBottom>
              Gamma: {liveStreamState.gamma?.toFixed(2) || 1.0}
            </Typography>
            <Slider
              value={liveStreamState.gamma || 1.0}
              onChange={(_, value) => dispatch(liveStreamSlice.setGamma(value))}
              valueLabelDisplay="auto"
              min={0.1}
              max={3.0}
              step={0.1}
            />
          </Box>
        </Collapse>

        {/* Stream Controls */}
        <StreamControls
          isStreamRunning={isStreamRunning}
          onToggleStream={handleToggleStream}
          onSnap={handleSnap}
          isRecording={isRecording}
          onStartRecord={handleStartRecord}
          onStopRecord={handleStopRecord}
          snapFileName={snapFileName}
          setSnapFileName={setSnapFileName}
          onGoToImage={handleGoToImage}
          lastSnapPath={lastSnapPath}
        />

        {/* Expandable Settings Panel */}
        <Collapse in={showSettings}>
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <StreamSettings 
              onOpen={(reloadFn) => {
                // Provide reload function for timeout recovery
                if (reloadFn) reloadFn();
              }}
            />
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
};

export default StreamControlOverlay;
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
  Tooltip
} from '@mui/material';
import {
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Brightness6 as BrightnessIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import * as liveStreamSlice from '../state/slices/LiveStreamSlice.js';

/**
 * StreamControlOverlay - Transparent overlay for stream controls
 * Positioned over the video stream with collapsible panels
 */
const StreamControlOverlay = ({ hostIP, hostPort }) => {
  const dispatch = useDispatch();
  const liveStreamState = useSelector(liveStreamSlice.getLiveStreamState);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAutoContrast, setShowAutoContrast] = useState(true);
  
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
  
  if (!isExpanded) {
    // Collapsed state - just show icon button
    return (
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 10
        }}
      >
        <Tooltip title="Window/Level Controls">
          <IconButton
            onClick={() => setIsExpanded(true)}
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
              },
            }}
          >
            <BrightnessIcon />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }
  
  // Expanded state - show full controls
  return (
    <Paper
      sx={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(5px)',
        color: 'white',
        p: 2,
        minWidth: 280,
        maxWidth: 320,
        borderRadius: 2,
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          Window/Level
        </Typography>
        <IconButton
          size="small"
          onClick={() => setIsExpanded(false)}
          sx={{ color: 'white' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      
      {/* Stream Format Indicator */}
      <Box sx={{ mb: 2, p: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 1 }}>
        <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255, 255, 255, 0.7)' }}>
          Format: {liveStreamState.imageFormat?.toUpperCase() || 'UNKNOWN'}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255, 255, 255, 0.7)' }}>
          Range: 0 - {getMaxValue()}
        </Typography>
      </Box>
      
      {/* Min/Max Sliders */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" gutterBottom>
          Window: {liveStreamState.minVal} - {liveStreamState.maxVal}
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
          sx={{
            color: 'white',
            '& .MuiSlider-thumb': {
              backgroundColor: 'white',
            },
            '& .MuiSlider-track': {
              backgroundColor: 'white',
            },
            '& .MuiSlider-rail': {
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
            },
          }}
        />
      </Box>
      
      {/* Gamma Slider */}
      <Box sx={{ mb: 2 }}>
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
          sx={{
            color: 'white',
            '& .MuiSlider-thumb': {
              backgroundColor: 'white',
            },
            '& .MuiSlider-track': {
              backgroundColor: 'white',
            },
            '& .MuiSlider-rail': {
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
            },
          }}
        />
      </Box>
      
      {/* Auto Contrast Button */}
      <Button
        fullWidth
        variant="outlined"
        size="small"
        onClick={handleAutoContrast}
        sx={{
          color: 'white',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          '&:hover': {
            borderColor: 'white',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        Auto Contrast
      </Button>
    </Paper>
  );
};

export default StreamControlOverlay;

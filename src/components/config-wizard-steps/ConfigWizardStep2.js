import React, { useEffect, useState } from "react";
import {
  Typography,
  Box,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Button,
  CircularProgress,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from "@mui/material";
import {
  FolderOpen as FolderIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

const ConfigWizardStep2 = ({ 
  selectedSource,
  availableSetups,
  selectedFile,
  onFileChange,
  loadedConfig,
  isLoading,
  loadError,
  onLoadCurrent,
  onLoadFile,
  onCreateNew,
  onRefreshFiles,
  onNext, 
  onBack, 
  activeStep, 
  totalSteps 
}) => {
  const [localSelectedFile, setLocalSelectedFile] = useState(selectedFile || '');

  useEffect(() => {
    setLocalSelectedFile(selectedFile || '');
  }, [selectedFile]);

  const handleFileSelect = (event) => {
    const file = event.target.value;
    setLocalSelectedFile(file);
    onFileChange(file);
  };

  const handleLoadFile = () => {
    if (selectedSource === 'current') {
      onLoadCurrent();
    } else if (selectedSource === 'existing' && localSelectedFile) {
      onLoadFile(localSelectedFile);
    } else if (selectedSource === 'new') {
      onCreateNew();
    }
  };

  const getConfigurationSummary = (config) => {
    if (!config || typeof config !== 'object') return null;
    
    const summary = {
      detectors: config.detector ? Object.keys(config.detector).length : 0,
      actuators: config.actuators ? Object.keys(config.actuators).length : 0,
      positioners: config.positioners ? Object.keys(config.positioners).length : 0,
      totalDevices: 0,
    };
    
    summary.totalDevices = summary.detectors + summary.actuators + summary.positioners;
    
    return summary;
  };

  const renderSourceSpecificContent = () => {
    switch (selectedSource) {
      case 'current':
        return (
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SettingsIcon sx={{ mr: 1 }} color="primary" />
              Load Current Active Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              This will load the configuration that is currently running in your UC2 system.
              This is the safest starting point for making modifications.
            </Typography>
            <Button
              variant="contained"
              onClick={handleLoadFile}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : <SettingsIcon />}
            >
              {isLoading ? 'Loading Current Config...' : 'Load Current Configuration'}
            </Button>
          </Paper>
        );

      case 'existing':
        return (
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FolderIcon sx={{ mr: 1 }} color="primary" />
              Select Configuration File
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
              <FormControl fullWidth>
                <InputLabel id="config-file-select">Available Configuration Files</InputLabel>
                <Select
                  labelId="config-file-select"
                  value={localSelectedFile}
                  onChange={handleFileSelect}
                  disabled={isLoading}
                >
                  {availableSetups.map((setup, index) => (
                    <MenuItem key={index} value={setup}>
                      {setup}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={onRefreshFiles}
                disabled={isLoading}
              >
                Refresh
              </Button>
            </Box>

            <Button
              variant="contained"
              onClick={handleLoadFile}
              disabled={!localSelectedFile || isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : <FolderIcon />}
            >
              {isLoading ? 'Loading Configuration...' : 'Load Selected Configuration'}
            </Button>
          </Paper>
        );

      case 'new':
        return (
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AddIcon sx={{ mr: 1 }} color="primary" />
              Create New Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              This will create a new configuration template with basic structure.
              You'll be able to customize all settings in the next step.
            </Typography>
            <Button
              variant="contained"
              onClick={handleLoadFile}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : <AddIcon />}
            >
              {isLoading ? 'Creating Template...' : 'Create New Configuration'}
            </Button>
          </Paper>
        );

      default:
        return null;
    }
  };

  const summary = loadedConfig ? getConfigurationSummary(loadedConfig) : null;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Load Configuration
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Based on your selection, load the configuration file that will serve as your starting point.
      </Alert>

      {isLoading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Loading configuration...
          </Typography>
        </Box>
      )}

      {renderSourceSpecificContent()}

      {loadError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Failed to load configuration: {loadError}
          </Typography>
        </Alert>
      )}

      {loadedConfig && !isLoading && (
        <Paper elevation={2} sx={{ p: 3, mb: 3, backgroundColor: 'success.light', color: 'success.contrastText' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CheckIcon sx={{ mr: 1 }} />
            Configuration Loaded Successfully
          </Typography>
          
          {summary && (
            <Box>
              <Typography variant="body2" paragraph>
                Configuration overview:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Chip 
                  label={`${summary.detectors} Detector${summary.detectors !== 1 ? 's' : ''}`} 
                  size="small" 
                  color="primary" 
                />
                <Chip 
                  label={`${summary.actuators} Actuator${summary.actuators !== 1 ? 's' : ''}`} 
                  size="small" 
                  color="primary" 
                />
                <Chip 
                  label={`${summary.positioners} Positioner${summary.positioners !== 1 ? 's' : ''}`} 
                  size="small" 
                  color="primary" 
                />
                <Chip 
                  label={`${summary.totalDevices} Total Devices`} 
                  size="small" 
                  variant="outlined" 
                  color="primary"
                />
              </Box>
              
              {selectedSource === 'existing' && localSelectedFile && (
                <Typography variant="body2">
                  <strong>Source file:</strong> {localSelectedFile}
                </Typography>
              )}
            </Box>
          )}
        </Paper>
      )}

      {!loadedConfig && !isLoading && !loadError && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please load a configuration to continue to the next step.
        </Alert>
      )}
    </Box>
  );
};

export default ConfigWizardStep2;
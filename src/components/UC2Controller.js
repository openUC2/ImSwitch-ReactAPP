import React, { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Paper,
  Tabs,
  Tab,
  Box,
  Typography,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  TextField,
  Checkbox,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Preview as PreviewIcon,
  Save as SaveIcon,
  AutoFixHigh as WizardIcon,
} from "@mui/icons-material";
import { useWebSocket } from "../context/WebSocketContext";
import { JsonEditor } from "json-edit-react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
import * as uc2Slice from "../state/slices/UC2Slice.js";
import {
  setNotification,
  clearNotification,
} from "../state/slices/NotificationSlice";
import ConfigurationPreviewDialog from "./ConfigurationPreviewDialog";
import ConfigurationWizard from "./ConfigurationWizard";
import {
  validateConfiguration,
  validateJsonString,
  createConfigurationPreview,
} from "../utils/configValidation";

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    {...other}
    id={`simple-tabpanel-${index}`}
    aria-labelledby={`simple-tab-${index}`}
  >
    {value === index && <Box p={3}>{children}</Box>}
  </div>
);

const goToWebsite = () => {
  window.open("https://youseetoo.github.io", "_blank");
};

const UC2Controller = ({ hostIP, hostPort, mode = "full" }) => {
  // Redux dispatcher
  const dispatch = useDispatch();

  // Access global Redux state
  const uc2State = useSelector(uc2Slice.getUc2State);

  // Use Redux state instead of local useState
  const availableSetups = uc2State.availableSetups;
  const tabIndex = uc2State.tabIndex;
  const selectedSetup = uc2State.selectedSetup;
  const isDialogOpen = uc2State.isDialogOpen;
  const restartSoftware = uc2State.restartSoftware;
  const serialPayload = uc2State.serialPayload;
  const serialLog = uc2State.serialLog;
  const uc2Connected = uc2State.uc2Connected;
  const selectedFileForEdit = uc2State.selectedFileForEdit;
  const editorJson = uc2State.editorJson;
  const editorJsonText = uc2State.editorJsonText;
  const useAceEditor = uc2State.useAceEditor;
  const newFileName = uc2State.newFileName;
  const setAsCurrentConfig = uc2State.setAsCurrentConfig;
  const restartAfterSave = uc2State.restartAfterSave;
  const overwriteFile = uc2State.overwriteFile;
  const currentActiveFilename = uc2State.currentActiveFilename;
  const isLoadingCurrentFilename = uc2State.isLoadingCurrentFilename;

  // New state properties
  const isLoadingFile = uc2State.isLoadingFile;
  const isSavingFile = uc2State.isSavingFile;
  const isRestarting = uc2State.isRestarting;
  const validationResult = uc2State.validationResult;
  const configPreview = uc2State.configPreview;
  const showPreviewDialog = uc2State.showPreviewDialog;

  // Wizard state
  const [showConfigWizard, setShowConfigWizard] = React.useState(false);

  const socket = useWebSocket();

  const fetchCurrentActiveFilename = useCallback(() => {
    const url = `${hostIP}:${hostPort}/UC2ConfigController/getCurrentSetupFilename`;
    dispatch(uc2Slice.setIsLoadingCurrentFilename(true));
    
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // Handle different possible response formats
        let filename = null;
        
        if (typeof data === 'string') {
          filename = data;
        } else if (data && typeof data === 'object') {
          filename = data.current_setup || data.currentSetupFilename || data.setupFileName || JSON.stringify(data);
        } else {
          filename = String(data);
        }
        
        // Extract just the filename from full path if needed
        if (filename && filename.includes('/')) {
          filename = filename.split('/').pop();
        } else if (filename && filename.includes('\\')) {
          // Handle Windows paths
          filename = filename.split('\\').pop();
        }
        
        const activeFilename = filename || 'current_config.json';
        dispatch(uc2Slice.setCurrentActiveFilename(activeFilename));
      })
      .catch((error) => {
        console.error("Error fetching current setup filename:", error);
        dispatch(uc2Slice.setCurrentActiveFilename('current_config.json')); // fallback
      })
      .finally(() => {
        dispatch(uc2Slice.setIsLoadingCurrentFilename(false));
      });
  }, [hostIP, hostPort, dispatch]);

  const fetchAvailableSetups = useCallback(() => {
    const url = `${hostIP}:${hostPort}/UC2ConfigController/returnAvailableSetups`;
    dispatch(
      setNotification({
        message: "Loading available setups...",
        type: "info",
      })
    );

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        dispatch(uc2Slice.setAvailableSetups(data.available_setups || []));
        dispatch(
          setNotification({
            message: `Found ${
              data.available_setups?.length || 0
            } configuration files`,
            type: "success",
          })
        );
        setTimeout(() => dispatch(clearNotification()), 3000);
      })
      .catch((error) => {
        console.error("Error fetching setups:", error);
        dispatch(
          setNotification({
            message: "Failed to load configuration files",
            type: "error",
          })
        );
        setTimeout(() => dispatch(clearNotification()), 3000);
      });
  }, [hostIP, hostPort, dispatch]);

  const monitorRestartStatus = useCallback(() => {
    let retryCount = 0;
    const maxRetries = 5; // 5 minutes with 10-second intervals

    const checkStatus = () => {
      fetch(`${hostIP}:${hostPort}/UC2ConfigController/is_connected`)
        .then((res) => res.json())
        .then((data) => {
          if (data === true) {
            dispatch(
              setNotification({
                message: "ImSwitch is back online!",
                type: "success",
              })
            );
            dispatch(uc2Slice.setIsRestarting(false));
            // Refresh current active filename after restart
            fetchCurrentActiveFilename();
            setTimeout(() => dispatch(clearNotification()), 3000);
          } else {
            throw new Error("Not connected yet");
          }
        })
        .catch(() => {
          retryCount++;
          if (retryCount < maxRetries) {
            dispatch(
              setNotification({
                message: `Waiting for ImSwitch to restart... (${retryCount}/${maxRetries})`,
                type: "info",
              })
            );
            setTimeout(checkStatus, 10000); // Check every 10 seconds
          } else {
            dispatch(
              setNotification({
                message:
                  "ImSwitch restart taking longer than expected. Please check manually.",
                type: "warning",
              })
            );
            dispatch(uc2Slice.setIsRestarting(false));
          }
        });
    };

    // Start checking after 5 seconds
    setTimeout(checkStatus, 5000);
  }, [hostIP, hostPort, dispatch, fetchCurrentActiveFilename]);

  const restartImSwitch = () => {
    //https://100.71.92.70:8001/UC2ConfigController/restartImSwitch
    const url = `${hostIP}:${hostPort}/UC2ConfigController/restartImSwitch`;
    fetch(url)
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) => console.error("Error:", error));
  };

  useEffect(() => {
    if (!socket) return;
    const handleSignal = (data) => {
      try {
        const jdata = JSON.parse(data);
        if (jdata.name === "sigUC2SerialReadMessage") {
          dispatch(uc2Slice.addSerialLogEntry(jdata.args?.p0 || ""));
        } else if (jdata.name === "sigUC2SerialWriteMessage") {
          dispatch(
            uc2Slice.addSerialLogEntry(`Write Message: ${jdata.args?.p0 || ""}`)
          );
        }
      } catch (error) {
        console.error("Error parsing signal data:", error);
      }
    };
    socket.on("signal", handleSignal);
    return () => {
      socket.off("signal", handleSignal);
    };
  }, [socket, dispatch]);

  useEffect(() => {
    fetchAvailableSetups();
    fetchCurrentActiveFilename();
  }, [fetchAvailableSetups, fetchCurrentActiveFilename]);

  // Auto-select the current active file when both are available
  useEffect(() => {
    if (currentActiveFilename && availableSetups.includes(currentActiveFilename) && !selectedFileForEdit) {
      dispatch(uc2Slice.setSelectedFileForEdit(currentActiveFilename));
    }
  }, [currentActiveFilename, availableSetups, selectedFileForEdit, dispatch]);

  useEffect(() => {
    const checkConnection = () => {
      fetch(`${hostIP}:${hostPort}/UC2ConfigController/is_connected`)
        .then((res) => res.json())
        .then((data) => {
          dispatch(uc2Slice.setUc2Connected(data === true));
        })
        .catch(() => dispatch(uc2Slice.setUc2Connected(false)));
    };
    checkConnection();
    const intervalId = setInterval(checkConnection, 5000);
    return () => clearInterval(intervalId);
  }, [hostIP, hostPort, dispatch]);

  const handleTabChange = (event, newValue) => {
    dispatch(uc2Slice.setTabIndex(newValue));
  };

  const handleSetupChange = (event) => {
    dispatch(uc2Slice.setSelectedSetup(event.target.value));
  };

  const reconnect = () => {
    fetch(`${hostIP}:${hostPort}/UC2ConfigController/reconnect`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) => console.error("Error:", error));
  };

  const restartESPBoard = () => {
    fetch(`${hostIP}:${hostPort}/UC2ConfigController/espRestart`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) => console.error("Error:", error));
  };
  const btConnect = () => {
    fetch(`${hostIP}:${hostPort}/UC2ConfigController/btpairing`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) => console.error("Error:", error));
  };

  const handleSetSetup = () => {
    if (!selectedSetup) {
      dispatch(
        setNotification({
          message: "Please select a setup before proceeding",
          type: "warning",
        })
      );
      return;
    }

    dispatch(uc2Slice.setIsRestarting(true));
    dispatch(
      setNotification({
        message: "Setting up configuration...",
        type: "info",
      })
    );

    const url = `${hostIP}:${hostPort}/UC2ConfigController/setSetupFileName?setupFileName=${encodeURIComponent(
      selectedSetup
    )}&restartSoftware=${restartSoftware}`;

    fetch(url, { method: "GET" })
      .then((response) => response.json())
      .then((data) => {
        console.log("Setup selected:", data);
        dispatch(uc2Slice.setIsDialogOpen(true));

        if (restartSoftware) {
          dispatch(
            setNotification({
              message: "ImSwitch is restarting... Please wait",
              type: "info",
            })
          );
          // Start monitoring connection status
          monitorRestartStatus();
        } else {
          dispatch(
            setNotification({
              message: "Configuration updated successfully",
              type: "success",
            })
          );
          dispatch(uc2Slice.setIsRestarting(false));
          // Refresh current active filename after successful change
          fetchCurrentActiveFilename();
          setTimeout(() => dispatch(clearNotification()), 3000);
        }
      })
      .catch((error) => {
        console.error("Error setting setup:", error);
        if (restartSoftware) {
          dispatch(
            setNotification({
              message: "Configuration change initiated. ImSwitch is restarting... Please wait",
              type: "info",
            })
          );
          // Start monitoring connection status even on "error" as it might just be a restart
          monitorRestartStatus();
        } else {
          dispatch(
            setNotification({
              message: "There was an issue applying the configuration. Please try again or check the connection.",
              type: "warning",
            })
          );
          dispatch(uc2Slice.setIsRestarting(false));
        }
      });
  };

  const handleDialogClose = () => {
    dispatch(uc2Slice.setIsDialogOpen(false)); // Close the dialog
  };

  const handleNewConfig = () => {
    dispatch(uc2Slice.setUseAceEditor(true));
    dispatch(uc2Slice.setEditorJson(null));
    dispatch(uc2Slice.setEditorJsonText("{\n  \n}"));
    dispatch(uc2Slice.setSelectedFileForEdit(""));
  };

  const loadConfigurationFile = useCallback((fileName) => {
    if (!fileName) return;

    dispatch(uc2Slice.setIsLoadingFile(true));
    dispatch(uc2Slice.setUseAceEditor(false));
    dispatch(
      setNotification({
        message: `Loading ${fileName}...`,
        type: "info",
      })
    );

    const url = `${hostIP}:${hostPort}/UC2ConfigController/readSetupFile?setupFileName=${encodeURIComponent(
      fileName
    )}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        dispatch(uc2Slice.setEditorJson(data));
        dispatch(
          setNotification({
            message: `${fileName} loaded successfully`,
            type: "success",
          })
        );
        setTimeout(() => dispatch(clearNotification()), 3000);
      })
      .catch((error) => {
        console.error("Error loading setup file:", error);
        dispatch(
          setNotification({
            message: `Failed to load ${fileName}`,
            type: "error",
          })
        );
      })
      .finally(() => {
        dispatch(uc2Slice.setIsLoadingFile(false));
      });
  }, [hostIP, hostPort, dispatch]);

  const handleLoadSetupFile = () => {
    if (!selectedFileForEdit) {
      dispatch(
        setNotification({
          message: "Please select a file to load",
          type: "warning",
        })
      );
      return;
    }

    loadConfigurationFile(selectedFileForEdit);
  };

  // Auto-load current active file when it becomes available
  useEffect(() => {
    if (currentActiveFilename && availableSetups.includes(currentActiveFilename) && !editorJson) {
      loadConfigurationFile(currentActiveFilename);
    }
  }, [currentActiveFilename, availableSetups, editorJson, loadConfigurationFile]);

  const handlePreviewConfig = () => {
    if (!newFileName) {
      dispatch(
        setNotification({
          message: "Please provide a filename",
          type: "warning",
        })
      );
      return;
    }

    let finalJson = null;

    // Get JSON content based on editor type
    if (useAceEditor) {
      if (!editorJsonText.trim()) {
        dispatch(
          setNotification({
            message: "No JSON content to preview",
            type: "warning",
          })
        );
        return;
      }

      const jsonValidation = validateJsonString(editorJsonText);
      if (!jsonValidation.isValid) {
        dispatch(
          setNotification({
            message: `Invalid JSON: ${jsonValidation.error}`,
            type: "error",
          })
        );
        return;
      }
      finalJson = jsonValidation.parsed;
    } else {
      if (!editorJson) {
        dispatch(
          setNotification({
            message: "No JSON content to preview",
            type: "warning",
          })
        );
        return;
      }
      finalJson = editorJson;
    }

    // Validate configuration
    const validation = validateConfiguration(finalJson);
    dispatch(uc2Slice.setValidationResult(validation));

    // Create preview
    const preview = createConfigurationPreview(finalJson);
    dispatch(uc2Slice.setConfigPreview(preview));

    // Show preview dialog
    dispatch(uc2Slice.setShowPreviewDialog(true));
  };

  const handleConfirmSave = () => {
    dispatch(uc2Slice.setShowPreviewDialog(false));
    handleSaveFile();
  };

  const handleSaveFile = () => {
    if (!newFileName) {
      dispatch(
        setNotification({
          message: "Please provide a filename",
          type: "warning",
        })
      );
      return;
    }

    let finalJson = null;
    if (useAceEditor) {
      if (!editorJsonText.trim()) {
        dispatch(
          setNotification({
            message: "No JSON content to save",
            type: "warning",
          })
        );
        return;
      }

      const jsonValidation = validateJsonString(editorJsonText);
      if (!jsonValidation.isValid) {
        dispatch(
          setNotification({
            message: `Invalid JSON: ${jsonValidation.error}`,
            type: "error",
          })
        );
        return;
      }
      finalJson = jsonValidation.parsed;
    } else {
      if (!editorJson) {
        dispatch(
          setNotification({
            message: "No JSON content to save",
            type: "warning",
          })
        );
        return;
      }
      finalJson = editorJson;
    }

    dispatch(uc2Slice.setIsSavingFile(true));
    dispatch(
      setNotification({
        message: "Saving configuration file...",
        type: "info",
      })
    );

    const url = `${hostIP}:${hostPort}/UC2ConfigController/writeNewSetupFile?setupFileName=${encodeURIComponent(
      newFileName
    )}&setAsCurrentConfig=${setAsCurrentConfig}&restart=${restartAfterSave}&overwrite=${overwriteFile}`;

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalJson),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("File saved:", data);
        dispatch(
          setNotification({
            message: "Configuration file saved successfully",
            type: "success",
          })
        );

        // Refresh available setups
        fetchAvailableSetups();

        if (restartAfterSave) {
          dispatch(
            setNotification({
              message: "ImSwitch is restarting with new configuration...",
              type: "info",
            })
          );
          monitorRestartStatus();
        } else {
          setTimeout(() => dispatch(clearNotification()), 3000);
        }
      })
      .catch((error) => {
        console.error("Error saving file:", error);
        dispatch(
          setNotification({
            message: "Failed to save configuration file",
            type: "error",
          })
        );
      })
      .finally(() => {
        dispatch(uc2Slice.setIsSavingFile(false));
      });
  };

  const handleSendSerial = () => {
    if (!serialPayload) return;
    const url = `${hostIP}:${hostPort}/UC2ConfigController/writeSerial?payload=${encodeURIComponent(
      serialPayload
    )}`;
    fetch(url, { method: "GET" })
      .then((response) => response.json())
      .then(() =>
        dispatch(uc2Slice.addSerialLogEntry(`Sent: ${serialPayload}`))
      )
      .catch((error) => console.error("Error sending serial:", error));
  };

  return (
    <>
      {/* Mode-specific rendering */}
      {mode === "selectSetup" && (
        <Paper>
          <Box p={3}>
            <Typography variant="h4" gutterBottom>
              Select Setup Configuration
            </Typography>
            {/* Content from TabPanel index={1} - Select Setup */}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
                >
                  <Typography variant="h6">Select Available Setup</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={() => {
                      fetchAvailableSetups();
                      fetchCurrentActiveFilename();
                    }}
                    disabled={isRestarting}
                  >
                    Refresh
                  </Button>
                </Box>

                {/* Current Active Configuration Display */}
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 2, 
                    mb: 3, 
                    backgroundColor: "info.light",
                    color: "info.contrastText"
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Currently Active Configuration:
                    </Typography>
                    {isLoadingCurrentFilename && (
                      <CircularProgress size={16} color="inherit" />
                    )}
                  </Box>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontFamily: "monospace",
                      fontWeight: "bold"
                    }}
                  >
                    {currentActiveFilename || "Loading..."}
                  </Typography>
                </Paper>

                {isRestarting && (
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      {restartSoftware
                        ? "ImSwitch is restarting... Please wait, this may take a few minutes."
                        : "Processing configuration change..."}
                    </Typography>
                  </Box>
                )}

                <FormControl fullWidth style={{ marginBottom: "20px" }}>
                  <InputLabel id="setup-select-label">
                    Available Setups
                  </InputLabel>
                  <Select
                    labelId="setup-select-label"
                    value={selectedSetup}
                    onChange={handleSetupChange}
                    disabled={isRestarting}
                  >
                    {availableSetups.map((setup, index) => (
                      <MenuItem 
                        key={index} 
                        value={setup}
                        sx={{
                          backgroundColor: setup === currentActiveFilename ? "success.light" : "inherit",
                          color: setup === currentActiveFilename ? "success.contrastText" : "inherit",
                          fontWeight: setup === currentActiveFilename ? "bold" : "normal",
                          "&:hover": {
                            backgroundColor: setup === currentActiveFilename ? "success.main" : "action.hover",
                          }
                        }}
                      >
                        {setup}
                        {setup === currentActiveFilename && " ⭐ (Currently Active)"}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Switch to enable/disable restart */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={restartSoftware}
                      onChange={(e) =>
                        dispatch(uc2Slice.setRestartSoftware(e.target.checked))
                      }
                      disabled={isRestarting}
                    />
                  }
                  label="Restart Software After Setup"
                />

                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleSetSetup}
                    disabled={!selectedSetup || isRestarting}
                    startIcon={
                      isRestarting ? <CircularProgress size={20} /> : null
                    }
                  >
                    {isRestarting ? "Processing..." : "Apply Setup"}
                  </Button>
                </Box>

                {/* Confirmation Dialog */}
                <Dialog open={isDialogOpen} onClose={handleDialogClose}>
                  <DialogTitle>
                    {restartSoftware ? "System Restart in Progress" : "Configuration Updated"}
                  </DialogTitle>
                  <DialogContent>
                    <Typography>
                      {restartSoftware ? (
                        <>
                          ImSwitch is restarting with the new configuration. This process may take several minutes.
                          <br/><br/>
                          Please wait patiently while the system:
                          <br/>• Applies the new configuration
                          <br/>• Restarts the software
                          <br/>• Reconnects to hardware
                          <br/><br/>
                          You will receive a notification when the system is ready.
                        </>
                      ) : (
                        "The configuration has been updated successfully without restarting the software."
                      )}
                    </Typography>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={handleDialogClose} color="primary">
                      {restartSoftware ? "Understood" : "OK"}
                    </Button>
                  </DialogActions>
                </Dialog>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}

      {mode === "configurationEditor" && (
        <Paper>
          <Box p={3}>
            <Typography variant="h4" gutterBottom>
              Configuration Editor
            </Typography>
            {/* Content from TabPanel index={3} - Configuration Editor */}
            {/* Wizard Launch Section */}
            <Paper
              elevation={2}
              sx={{
                p: 3,
                mb: 3,
                backgroundColor: "primary.light",
                color: "primary.contrastText",
              }}
            >
              <Typography
                variant="h6"
                sx={{ display: "flex", alignItems: "center", mb: 2 }}
              >
                <WizardIcon sx={{ mr: 1 }} />
                Recommended: Use Configuration Wizard
              </Typography>
              <Typography variant="body2" paragraph>
                Get guided through the configuration process step-by-step with
                built-in validation, preview, and easy save options. Perfect for
                beginners and complex configurations.
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<WizardIcon />}
                onClick={() => setShowConfigWizard(true)}
                sx={{
                  backgroundColor: "background.paper",
                  color: "primary.main",
                  "&:hover": { backgroundColor: "grey.100" },
                }}
              >
                Launch Configuration Wizard
              </Button>
            </Paper>

            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              Or use the advanced editor below:
            </Typography>

            {/* Current Active Configuration Display */}
            <Paper 
              elevation={1} 
              sx={{ 
                p: 2, 
                mb: 3, 
                backgroundColor: "grey.50",
                border: "1px solid",
                borderColor: "grey.300"
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Current Active Configuration:
                </Typography>
                {isLoadingCurrentFilename && (
                  <CircularProgress size={16} />
                )}
              </Box>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontFamily: "monospace",
                  color: currentActiveFilename ? "text.primary" : "text.secondary",
                  fontStyle: currentActiveFilename ? "normal" : "italic"
                }}
              >
                {currentActiveFilename || "Loading..."}
              </Typography>
              {currentActiveFilename && availableSetups.includes(currentActiveFilename) && (
                <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                  ✓ This file is available for editing and has been automatically selected below
                </Typography>
              )}
              {currentActiveFilename && !availableSetups.includes(currentActiveFilename) && (
                <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                  ⚠ This file is not found in available setups list
                </Typography>
              )}
            </Paper>

            {(isLoadingFile || isSavingFile) && (
              <Box sx={{ mt: 2, mb: 2 }}>
                <LinearProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {isLoadingFile
                    ? "Loading configuration file..."
                    : "Saving configuration file..."}
                </Typography>
              </Box>
            )}

            <Box mt={2}>
              <FormControl fullWidth style={{ marginBottom: "20px" }}>
                <InputLabel id="editor-select-label">
                  Select a file to load
                </InputLabel>
                <Select
                  labelId="editor-select-label"
                  value={selectedFileForEdit}
                  onChange={(e) =>
                    dispatch(uc2Slice.setSelectedFileForEdit(e.target.value))
                  }
                  disabled={isLoadingFile || isSavingFile}
                >
                  {availableSetups.map((setup, index) => (
                    <MenuItem key={index} value={setup}>
                      {setup}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleLoadSetupFile}
                  disabled={!selectedFileForEdit || isLoadingFile || isSavingFile}
                  startIcon={
                    isLoadingFile ? <CircularProgress size={20} /> : null
                  }
                >
                  {isLoadingFile ? "Loading..." : "Load File"}
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNewConfig}
                  disabled={isLoadingFile || isSavingFile}
                >
                  New File
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => {
                    fetchAvailableSetups();
                    fetchCurrentActiveFilename();
                  }}
                  disabled={isLoadingFile || isSavingFile}
                  size="small"
                >
                  Refresh List
                </Button>
              </Box>
            </Box>

            <Box mt={2}>
              {useAceEditor ? (
                <>
                  <Typography>File content (AceEditor for new files):</Typography>
                  <AceEditor
                    mode="json"
                    setOptions={{ useWorker: false }}
                    theme="github"
                    onChange={(value) =>
                      dispatch(uc2Slice.setEditorJsonText(value))
                    }
                    value={editorJsonText}
                    name="jsonEditor"
                    editorProps={{ $blockScrolling: true }}
                    width="100%"
                    height="400px"
                    readOnly={isLoadingFile || isSavingFile}
                  />
                </>
              ) : editorJson ? (
                <>
                  <Typography>
                    File content (json-edit-react for loaded files):
                  </Typography>
                  <div
                    style={{
                      height: "400px",
                      overflow: "auto",
                      border: "1px solid #ccc",
                    }}
                  >
                    <JsonEditor
                      data={editorJson}
                      setData={(data) => dispatch(uc2Slice.setEditorJson(data))}
                      readOnly={isLoadingFile || isSavingFile}
                    />
                  </div>
                </>
              ) : (
                <Typography variant="body2">No file loaded.</Typography>
              )}
            </Box>

            <Box mt={2}>
              <TextField
                label="Save As Filename"
                fullWidth
                value={newFileName}
                onChange={(e) =>
                  dispatch(uc2Slice.setNewFileName(e.target.value))
                }
                style={{ marginBottom: "20px" }}
                disabled={isLoadingFile || isSavingFile}
              />

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={setAsCurrentConfig}
                        onChange={(e) =>
                          dispatch(
                            uc2Slice.setSetAsCurrentConfig(e.target.checked)
                          )
                        }
                        disabled={isLoadingFile || isSavingFile}
                      />
                    }
                    label="Set as Current Config"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={restartAfterSave}
                        onChange={(e) =>
                          dispatch(uc2Slice.setRestartAfterSave(e.target.checked))
                        }
                        disabled={isLoadingFile || isSavingFile}
                      />
                    }
                    label="Restart After Save"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={overwriteFile}
                        onChange={(e) =>
                          dispatch(uc2Slice.setOverwriteFile(e.target.checked))
                        }
                        disabled={isLoadingFile || isSavingFile}
                      />
                    }
                    label="Overwrite if exists"
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={handlePreviewConfig}
                  disabled={
                    !newFileName ||
                    isLoadingFile ||
                    isSavingFile ||
                    (!editorJson && !editorJsonText.trim())
                  }
                  startIcon={<PreviewIcon />}
                >
                  Preview & Validate
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSaveFile}
                  disabled={
                    !newFileName ||
                    isLoadingFile ||
                    isSavingFile ||
                    (!editorJson && !editorJsonText.trim())
                  }
                  startIcon={
                    isSavingFile ? <CircularProgress size={20} /> : <SaveIcon />
                  }
                >
                  {isSavingFile ? "Saving..." : "Save"}
                </Button>
              </Box>
            </Box>

            {/* Configuration Preview Dialog */}
            <ConfigurationPreviewDialog
              open={showPreviewDialog}
              onClose={() => dispatch(uc2Slice.setShowPreviewDialog(false))}
              onConfirmSave={handleConfirmSave}
              validationResult={validationResult}
              configPreview={configPreview}
              filename={newFileName}
              isSaving={isSavingFile}
            />
          </Box>
        </Paper>
      )}

      {/* Original full UC2Controller with tabs (when mode === "full") */}
      {mode === "full" && (
      <Paper>
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          aria-label="settings tabs"
        >
          <Tab label="Reconnect to UC2 board" />
          <Tab label="Select Setup" />
          <Tab label="Serial CLI" />
          <Tab label="Configuration Editor" />
        </Tabs>

        <TabPanel value={tabIndex} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6">Restart ImSwitch</Typography>
              <Button
                style={{ marginBottom: "20px" }}
                variant="contained"
                onClick={restartImSwitch}
              >
                Restart
              </Button>
              <Typography variant="h6">Reconnect to UC2 board</Typography>
              <Button
                style={{ marginBottom: "20px" }}
                variant="contained"
                onClick={reconnect}
              >
                Reconnect
              </Button>
              <Typography variant="h6">UC2 Force Restart</Typography>
              <Button
                style={{ marginBottom: "20px" }}
                variant="contained"
                onClick={restartESPBoard}
              >
                Force Restart
              </Button>
              <Typography variant="h6">Bluetooth Pairing</Typography>
              <Button
                style={{ marginBottom: "20px" }}
                variant="contained"
                onClick={btConnect}
              >
                BT Pairing
              </Button>
              <Typography variant="h6">Flash New Firmware</Typography>
              <Button
                style={{ marginBottom: "20px" }}
                variant="contained"
                onClick={goToWebsite}
              >
                UC2-ESP32
              </Button>
              <Box sx={{ display: "flex", alignItems: "center", p: 1, gap: 1 }}>
                <Typography variant="body1">UC2 Connected:</Typography>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    backgroundColor: uc2Connected ? "green" : "red",
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabIndex} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <Typography variant="h6">Select Available Setup</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={() => {
                    fetchAvailableSetups();
                    fetchCurrentActiveFilename();
                  }}
                  disabled={isRestarting}
                >
                  Refresh
                </Button>
              </Box>

              {/* Current Active Configuration Display */}
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 2, 
                  mb: 3, 
                  backgroundColor: "info.light",
                  color: "info.contrastText"
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Currently Active Configuration:
                  </Typography>
                  {isLoadingCurrentFilename && (
                    <CircularProgress size={16} color="inherit" />
                  )}
                </Box>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontFamily: "monospace",
                    fontWeight: "bold"
                  }}
                >
                  {currentActiveFilename || "Loading..."}
                </Typography>
              </Paper>

              {isRestarting && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    {restartSoftware
                      ? "ImSwitch is restarting... Please wait, this may take a few minutes."
                      : "Processing configuration change..."}
                  </Typography>
                </Box>
              )}

              <FormControl fullWidth style={{ marginBottom: "20px" }}>
                <InputLabel id="setup-select-label">
                  Available Setups
                </InputLabel>
                <Select
                  labelId="setup-select-label"
                  value={selectedSetup}
                  onChange={handleSetupChange}
                  disabled={isRestarting}
                >
                  {availableSetups.map((setup, index) => (
                    <MenuItem 
                      key={index} 
                      value={setup}
                      sx={{
                        backgroundColor: setup === currentActiveFilename ? "success.light" : "inherit",
                        color: setup === currentActiveFilename ? "success.contrastText" : "inherit",
                        fontWeight: setup === currentActiveFilename ? "bold" : "normal",
                        "&:hover": {
                          backgroundColor: setup === currentActiveFilename ? "success.main" : "action.hover",
                        }
                      }}
                    >
                      {setup}
                      {setup === currentActiveFilename && " ⭐ (Currently Active)"}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Switch to enable/disable restart */}
              <FormControlLabel
                control={
                  <Switch
                    checked={restartSoftware}
                    onChange={(e) =>
                      dispatch(uc2Slice.setRestartSoftware(e.target.checked))
                    }
                    disabled={isRestarting}
                  />
                }
                label="Restart Software After Setup"
              />

              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleSetSetup}
                  disabled={!selectedSetup || isRestarting}
                  startIcon={
                    isRestarting ? <CircularProgress size={20} /> : null
                  }
                >
                  {isRestarting ? "Processing..." : "Apply Setup"}
                </Button>
              </Box>

              {/* Confirmation Dialog */}
              <Dialog open={isDialogOpen} onClose={handleDialogClose}>
                <DialogTitle>
                  {restartSoftware ? "System Restart in Progress" : "Configuration Updated"}
                </DialogTitle>
                <DialogContent>
                  <Typography>
                    {restartSoftware ? (
                      <>
                        ImSwitch is restarting with the new configuration. This process may take several minutes.
                        <br/><br/>
                        Please wait patiently while the system:
                        <br/>• Applies the new configuration
                        <br/>• Restarts the software
                        <br/>• Reconnects to hardware
                        <br/><br/>
                        You will receive a notification when the system is ready.
                      </>
                    ) : (
                      "The configuration has been updated successfully without restarting the software."
                    )}
                  </Typography>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleDialogClose} color="primary">
                    {restartSoftware ? "Understood" : "OK"}
                  </Button>
                </DialogActions>
              </Dialog>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabIndex} index={2}>
          <Typography variant="h6">Serial Command Line Interface</Typography>
          <TextField
            label="Serial Payload"
            variant="outlined"
            fullWidth
            multiline
            rows={4}
            value={serialPayload}
            onChange={(e) =>
              dispatch(uc2Slice.setSerialPayload(e.target.value))
            }
            style={{ marginBottom: "20px" }}
          />
          <Button variant="contained" onClick={handleSendSerial}>
            Send Serial
          </Button>
          <Box mt={2}>
            <Typography variant="subtitle1">Serial Log:</Typography>
            <Paper
              style={{
                maxHeight: 200,
                overflow: "auto",
                padding: "10px",
                marginTop: "10px",
              }}
            >
              {serialLog.map((entry, index) => (
                <Typography
                  key={index}
                  style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {entry}
                </Typography>
              ))}
            </Paper>
          </Box>
        </TabPanel>

        <TabPanel value={tabIndex} index={3}>
          <Typography variant="h6">Configuration Editor</Typography>

          {/* Wizard Launch Section */}
          <Paper
            elevation={2}
            sx={{
              p: 3,
              mb: 3,
              backgroundColor: "primary.light",
              color: "primary.contrastText",
            }}
          >
            <Typography
              variant="h6"
              sx={{ display: "flex", alignItems: "center", mb: 2 }}
            >
              <WizardIcon sx={{ mr: 1 }} />
              Recommended: Use Configuration Wizard
            </Typography>
            <Typography variant="body2" paragraph>
              Get guided through the configuration process step-by-step with
              built-in validation, preview, and easy save options. Perfect for
              beginners and complex configurations.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<WizardIcon />}
              onClick={() => setShowConfigWizard(true)}
              sx={{
                backgroundColor: "background.paper",
                color: "primary.main",
                "&:hover": { backgroundColor: "grey.100" },
              }}
            >
              Launch Configuration Wizard
            </Button>
          </Paper>

          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Or use the advanced editor below:
          </Typography>

          {/* Current Active Configuration Display */}
          <Paper 
            elevation={1} 
            sx={{ 
              p: 2, 
              mb: 3, 
              backgroundColor: "primary.light",
              color: "primary.contrastText",              
              border: "1px solid",
              borderColor: "grey.300"
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Current Active Configuration:
              </Typography>
              {isLoadingCurrentFilename && (
                <CircularProgress size={16} />
              )}
            </Box>
            <Typography 
              variant="body1" 
              sx={{ 
                fontFamily: "monospace",
                color: "primary.contrastText",
                fontStyle: currentActiveFilename ? "normal" : "italic"
              }}
            >
              {currentActiveFilename || "Loading..."}
            </Typography>
            {currentActiveFilename && availableSetups.includes(currentActiveFilename) && (
              <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                ✓ This file is available for editing and has been automatically selected below
              </Typography>
            )}
            {currentActiveFilename && !availableSetups.includes(currentActiveFilename) && (
              <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                ⚠ This file is not found in available setups list
              </Typography>
            )}
          </Paper>

          {(isLoadingFile || isSavingFile) && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {isLoadingFile
                  ? "Loading configuration file..."
                  : "Saving configuration file..."}
              </Typography>
            </Box>
          )}

          <Box mt={2}>
            <FormControl fullWidth style={{ marginBottom: "20px" }}>
              <InputLabel id="editor-select-label">
                Select a file to load
              </InputLabel>
              <Select
                labelId="editor-select-label"
                value={selectedFileForEdit}
                onChange={(e) =>
                  dispatch(uc2Slice.setSelectedFileForEdit(e.target.value))
                }
                disabled={isLoadingFile || isSavingFile}
              >
                {availableSetups.map((setup, index) => (
                  <MenuItem key={index} value={setup}>
                    {setup}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <Button
                variant="contained"
                onClick={handleLoadSetupFile}
                disabled={!selectedFileForEdit || isLoadingFile || isSavingFile}
                startIcon={
                  isLoadingFile ? <CircularProgress size={20} /> : null
                }
              >
                {isLoadingFile ? "Loading..." : "Load File"}
              </Button>
              <Button
                variant="contained"
                onClick={handleNewConfig}
                disabled={isLoadingFile || isSavingFile}
              >
                New File
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  fetchAvailableSetups();
                  fetchCurrentActiveFilename();
                }}
                disabled={isLoadingFile || isSavingFile}
                size="small"
              >
                Refresh List
              </Button>
            </Box>
          </Box>

          <Box mt={2}>
            {useAceEditor ? (
              <>
                <Typography>File content (AceEditor for new files):</Typography>
                <AceEditor
                  mode="json"
                  setOptions={{ useWorker: false }}
                  theme="github"
                  onChange={(value) =>
                    dispatch(uc2Slice.setEditorJsonText(value))
                  }
                  value={editorJsonText}
                  name="jsonEditor"
                  editorProps={{ $blockScrolling: true }}
                  width="100%"
                  height="400px"
                  readOnly={isLoadingFile || isSavingFile}
                />
              </>
            ) : editorJson ? (
              <>
                <Typography>
                  File content (json-edit-react for loaded files):
                </Typography>
                <div
                  style={{
                    height: "400px",
                    overflow: "auto",
                    border: "1px solid #ccc",
                  }}
                >
                  <JsonEditor
                    data={editorJson}
                    setData={(data) => dispatch(uc2Slice.setEditorJson(data))}
                    readOnly={isLoadingFile || isSavingFile}
                  />
                </div>
              </>
            ) : (
              <Typography variant="body2">No file loaded.</Typography>
            )}
          </Box>

          <Box mt={2}>
            <TextField
              label="Save As Filename"
              fullWidth
              value={newFileName}
              onChange={(e) =>
                dispatch(uc2Slice.setNewFileName(e.target.value))
              }
              style={{ marginBottom: "20px" }}
              disabled={isLoadingFile || isSavingFile}
            />

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={setAsCurrentConfig}
                      onChange={(e) =>
                        dispatch(
                          uc2Slice.setSetAsCurrentConfig(e.target.checked)
                        )
                      }
                      disabled={isLoadingFile || isSavingFile}
                    />
                  }
                  label="Set as Current Config"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={restartAfterSave}
                      onChange={(e) =>
                        dispatch(uc2Slice.setRestartAfterSave(e.target.checked))
                      }
                      disabled={isLoadingFile || isSavingFile}
                    />
                  }
                  label="Restart After Save"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={overwriteFile}
                      onChange={(e) =>
                        dispatch(uc2Slice.setOverwriteFile(e.target.checked))
                      }
                      disabled={isLoadingFile || isSavingFile}
                    />
                  }
                  label="Overwrite if exists"
                />
              </Grid>
            </Grid>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                onClick={handlePreviewConfig}
                disabled={
                  !newFileName ||
                  isLoadingFile ||
                  isSavingFile ||
                  (!editorJson && !editorJsonText.trim())
                }
                startIcon={<PreviewIcon />}
              >
                Preview & Validate
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveFile}
                disabled={
                  !newFileName ||
                  isLoadingFile ||
                  isSavingFile ||
                  (!editorJson && !editorJsonText.trim())
                }
                startIcon={
                  isSavingFile ? <CircularProgress size={20} /> : <SaveIcon />
                }
              >
                {isSavingFile ? "Saving..." : "Save"}
              </Button>
            </Box>
          </Box>

          {/* Configuration Preview Dialog */}
          <ConfigurationPreviewDialog
            open={showPreviewDialog}
            onClose={() => dispatch(uc2Slice.setShowPreviewDialog(false))}
            onConfirmSave={handleConfirmSave}
            validationResult={validationResult}
            configPreview={configPreview}
            filename={newFileName}
            isSaving={isSavingFile}
          />
        </TabPanel>
      </Paper>
      )}

      {/* Configuration Wizard - available for all modes */}
      <ConfigurationWizard
        open={showConfigWizard}
        onClose={() => setShowConfigWizard(false)}
        hostIP={hostIP}
        hostPort={hostPort}
      />
    </>
  );
};

export default UC2Controller;

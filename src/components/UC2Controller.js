import React, { useEffect } from "react";
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
} from "@mui/material";
import { useWebSocket } from "../context/WebSocketContext";
import { JsonEditor } from "json-edit-react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
import * as uc2Slice from "../state/slices/UC2Slice.js";

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

const UC2Controller = ({ hostIP, hostPort }) => {
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

  const socket = useWebSocket();

  useEffect(() => {
    if (!socket) return;
    const handleSignal = (data) => {
      try {
        const jdata = JSON.parse(data);
        if (jdata.name === "sigUC2SerialReadMessage") {
          dispatch(uc2Slice.addSerialLogEntry(jdata.args?.p0 || ""));
        } else if (jdata.name === "sigUC2SerialWriteMessage") {
          dispatch(uc2Slice.addSerialLogEntry(`Write Message: ${jdata.args?.p0 || ""}`));
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
  }, [dispatch]);

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
  }, [hostIP, hostPort]);

  const handleTabChange = (event, newValue) => {
    dispatch(uc2Slice.setTabIndex(newValue));
  };

  const fetchAvailableSetups = () => {
    const url = `${hostIP}:${hostPort}/UC2ConfigController/returnAvailableSetups`;
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        dispatch(uc2Slice.setAvailableSetups(data.available_setups || []));
      })
      .catch((error) => console.error("Error fetching setups:", error));
  };

  const handleSetupChange = (event) => {
    dispatch(uc2Slice.setSelectedSetup(event.target.value));
  };

  const reconnect = () => {
    fetch(`${hostIP}:${hostPort}/UC2ConfigController/reconnect`, { method: "GET" })
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) => console.error("Error:", error));
  };

  const restartESPBoard = () => {
    fetch(`${hostIP}:${hostPort}/UC2ConfigController/espRestart`, { method: "GET" })
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) => console.error("Error:", error));
  };
  const btConnect = () => {
    fetch(`${hostIP}:${hostPort}/UC2ConfigController/btpairing`, { method: "GET" })
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) => console.error("Error:", error));
  };

  const handleSetSetup = () => {
    if (!selectedSetup) {
      alert("Please select a setup before proceeding.");
      return;
    }

    const url = `${hostIP}:${hostPort}/UC2ConfigController/setSetupFileName?setupFileName=${encodeURIComponent(
      selectedSetup
    )}&restartSoftware=${restartSoftware}`;

    fetch(url, { method: "GET" })
      .then((response) => response.json())
      .then((data) => {
        console.log("Setup selected:", data);
        dispatch(uc2Slice.setIsDialogOpen(true)); // Open the confirmation dialog
      })
      .catch((error) => console.error("Error setting setup:", error));
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

  const handleLoadSetupFile = () => {
    if (!selectedFileForEdit) {
      alert("Please select a file to load.");
      return;
    }
    dispatch(uc2Slice.setUseAceEditor(false));
    const url = `${hostIP}:${hostPort}/UC2ConfigController/readSetupFile?setupFileName=${encodeURIComponent(
      selectedFileForEdit
    )}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        dispatch(uc2Slice.setEditorJson(data));
      })
      .catch((error) => console.error("Error loading setup file:", error));
  };

  const handleSaveFile = () => {
    if (!newFileName) {
      alert("Please provide a filename.");
      return;
    }

    let finalJson = null;
    if (useAceEditor) {
      if (!editorJsonText.trim()) {
        alert("No JSON content to save.");
        return;
      }
      try {
        finalJson = JSON.parse(editorJsonText);
      } catch (e) {
        alert("Invalid JSON format in the editor.");
        return;
      }
    } else {
      if (!editorJson) {
        alert("No JSON content to save.");
        return;
      }
      finalJson = editorJson;
    }

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
      })
      .catch((error) => console.error("Error saving file:", error));
  };

  const handleSendSerial = () => {
    if (!serialPayload) return;
    const url = `${hostIP}:${hostPort}/UC2ConfigController/writeSerial?payload=${encodeURIComponent(serialPayload)}`;
    fetch(url, { method: "GET" })
      .then((response) => response.json())
      .then(() => dispatch(uc2Slice.addSerialLogEntry(`Sent: ${serialPayload}`)))
      .catch((error) => console.error("Error sending serial:", error));
  };

  return (
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
            <Typography variant="h6">Select Available Setup</Typography>
            <FormControl fullWidth style={{ marginBottom: "20px" }}>
              <InputLabel id="setup-select-label">Available Setups</InputLabel>
              <Select
                labelId="setup-select-label"
                value={selectedSetup}
                onChange={handleSetupChange}
              >
                {availableSetups.map((setup, index) => (
                  <MenuItem key={index} value={setup}>
                    {setup}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {/* Switch to enable/disable restart */}
            <FormControlLabel
              control={
                <Switch
                  checked={restartSoftware}
                  onChange={(e) => dispatch(uc2Slice.setRestartSoftware(e.target.checked))}
                />
              }
              label="Restart Software After Setup"
            />

            <Button variant="contained" onClick={handleSetSetup}>
              OK
            </Button>

            {/* Confirmation Dialog */}
            <Dialog open={isDialogOpen} onClose={handleDialogClose}>
              <DialogTitle>Setup Update in Progress</DialogTitle>
              <DialogContent>
                <Typography>
                  The setup is being updated. This may take some time for the system
                  to restart and be back online.
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleDialogClose} color="primary">
                  OK
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
          onChange={(e) => dispatch(uc2Slice.setSerialPayload(e.target.value))}
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
        <Box mt={2}>
          <FormControl fullWidth style={{ marginBottom: "20px" }}>
            <InputLabel id="editor-select-label">Select a file to load</InputLabel>
            <Select
              labelId="editor-select-label"
              value={selectedFileForEdit}
              onChange={(e) => dispatch(uc2Slice.setSelectedFileForEdit(e.target.value))}
            >
              {availableSetups.map((setup, index) => (
                <MenuItem key={index} value={setup}>
                  {setup}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={handleLoadSetupFile}>
            Load File
          </Button>
          <Button
            variant="contained"
            onClick={handleNewConfig}
            style={{ marginLeft: "10px" }}
          >
            New File
          </Button>
        </Box>

        <Box mt={2}>
          {useAceEditor ? (
            <>
              <Typography>File content (AceEditor for new files):</Typography>
              <AceEditor
                mode="json"
                setOptions={{ useWorker: false }}
                theme="github"
                onChange={(value) => dispatch(uc2Slice.setEditorJsonText(value))}
                value={editorJsonText}
                name="jsonEditor"
                editorProps={{ $blockScrolling: true }}
                width="100%"
                height="400px"
              />
            </>
          ) : editorJson ? (
            <>
              <Typography>File content (json-edit-react for loaded files):</Typography>
              <div style={{ height: "400px", overflow: "auto", border: "1px solid #ccc" }}>
                <JsonEditor
                  data={editorJson}
                  setData={(data) => dispatch(uc2Slice.setEditorJson(data))}
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
            onChange={(e) => dispatch(uc2Slice.setNewFileName(e.target.value))}
            style={{ marginBottom: "20px" }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={setAsCurrentConfig}
                onChange={(e) => dispatch(uc2Slice.setSetAsCurrentConfig(e.target.checked))}
              />
            }
            label="Set as Current Config"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={restartAfterSave}
                onChange={(e) => dispatch(uc2Slice.setRestartAfterSave(e.target.checked))}
              />
            }
            label="Restart After Save"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={overwriteFile}
                onChange={(e) => dispatch(uc2Slice.setOverwriteFile(e.target.checked))}
              />
            }
            label="Overwrite if exists"
          />
          <Box mt={2}>
            <Button variant="contained" onClick={handleSaveFile}>
              Save
            </Button>
          </Box>
        </Box>
      </TabPanel>
    </Paper>
  );
};

export default UC2Controller;

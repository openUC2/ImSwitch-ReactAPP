import React, { useState, useEffect } from "react";
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
  FormControlLabel
} from "@mui/material";
import { useWebSocket } from "../context/WebSocketContext";
import { JsonEditor } from "json-edit-react";

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
};

const goToWebsite = () => {
  window.open("https://youseetoo.github.io", "_blank");
};

const UC2Controller = ({ hostIP, hostPort, WindowTitle }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [availableSetups, setAvailableSetups] = useState([]);
  const [selectedSetup, setSelectedSetup] = useState("");
  const [serialPayload, setSerialPayload] = useState("");
  const [serialLog, setSerialLog] = useState([]);

   // For the Config Editor tab
   const [selectedFileForEdit, setSelectedFileForEdit] = useState("");
   const [editorJson, setEditorJson] = useState(null);
   const [newFileName, setNewFileName] = useState("");
   const [setAsCurrentConfig, setSetAsCurrentConfig] = useState(true);
   const [restartAfterSave, setRestartAfterSave] = useState(false);
   const [overwriteFile, setOverwriteFile] = useState(false);
   const [uc2Connected, setUc2Connected] = useState(false);

  const socket = useWebSocket();

  useEffect(() => {
    if (!socket) return;
    const handleSignal = (data) => {
      try {
        const jdata = JSON.parse(data);

        // Example signals from your snippet
        if (jdata.name === "sigUC2SerialReadMessage") {
          // Appending the incoming serial message to the log
          setSerialLog((prev) => [...prev, jdata.args?.p0 || ""]);
        } else if (jdata.name === "sigUC2SerialWriteMessage") {
          // Could log when we successfully write
          setSerialLog((prev) => [
            ...prev,
            `Write Message: ${jdata.args?.p0 || ""}`,
          ]);
        } else if (jdata.name === "sigObjectiveChanged") {
          // Handle your existing logic
          // ...
        } else if (jdata.name === "sigUpdateImage") {
          // Handle your existing logic
          // ...
        }
      } catch (error) {
        console.error("Error parsing signal data:", error);
      }
    };
    socket.on("signal", handleSignal);
    return () => {
      socket.off("signal", handleSignal);
    };
  }, [socket]);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const fetchAvailableSetups = () => {
    const url = `${hostIP}:${hostPort}/UC2ConfigController/returnAvailableSetups`;
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        setAvailableSetups(data.available_setups || []);
      })
      .catch((error) => console.error("Error fetching setups:", error));
  };

  const handleSetupChange = (event) => {
    setSelectedSetup(event.target.value);
  };

  useEffect(() => {
    const checkConnection = () => {
      fetch(`${hostIP}:${hostPort}/UC2ConfigController/is_connected`)
        .then((res) => res.json())
        .then((data) => {
          setUc2Connected(data === true);
        })
        .catch(() => {
          setUc2Connected(false);
        });
    };
    // alle 5 Sekunden überprüfen
    checkConnection();
    const intervalId = setInterval(checkConnection, 5000);
    return () => clearInterval(intervalId);
  }, [hostIP, hostPort]);

  const reconnect = () => {
    const url = `${hostIP}:${hostPort}/UC2ConfigController/reconnect`;
    fetch(url, { method: "GET" })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
      })
      .catch((error) => console.error("Error:", error));
  };

  const btConnect = () => {
    const url = `${hostIP}:${hostPort}/UC2ConfigController/btpairing`;
    fetch(url, { method: "GET" })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
      })
      .catch((error) => console.error("Error:", error));
  };

  const handleSetSetup = () => {
    if (!selectedSetup) {
      alert("Please select a setup before proceeding.");
      return;
    }
    const url = `${hostIP}:${hostPort}/UC2ConfigController/setSetupFileName?setupFileName=${encodeURIComponent(
      selectedSetup
    )}`;
    fetch(url, { method: "GET" })
      .then((response) => response.json())
      .then((data) => {
        console.log("Setup selected:", data);
      })
      .catch((error) => console.error("Error setting setup:", error));
  };

   // Fetch the JSON content of the selected file
   const handleLoadSetupFile = () => {
    if (!selectedFileForEdit) {
      alert("Please select a file to load.");
      return;
    }
    const url = `${hostIP}:${hostPort}/UC2ConfigController/readSetupFile?setupFileName=${encodeURIComponent(
      selectedFileForEdit
    )}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setEditorJson(data);
      })
      .catch((error) => console.error("Error loading setup file:", error));
  };

   // Save the JSON to a new file (or overwrite existing, depending on user choice)
   const handleSaveFile = () => {
    if (!newFileName) {
      alert("Please provide a filename.");
      return;
    }
    if (!editorJson) {
      alert("No JSON content to save.");
      return;
    }
    const url = `${hostIP}:${hostPort}/UC2ConfigController/writeNewSetupFile?setupFileName=${encodeURIComponent(
      newFileName
    )}&setAsCurrentConfig=${setAsCurrentConfig}&restart=${restartAfterSave}&overwrite=${overwriteFile}`;
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(editorJson),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("File saved:", data);
      })
      .catch((error) => console.error("Error saving file:", error));
  };

  useEffect(() => {
    fetchAvailableSetups();
  }, []);

  // Send serial message via REST endpoint
  const handleSendSerial = () => {
    if (!serialPayload) return;
    const url = `${hostIP}:${hostPort}/UC2ConfigController/writeSerial?payload=${encodeURIComponent(
      serialPayload
    )}`;
    fetch(url, { method: "GET" })
      .then((response) => response.json())
      .then((data) => {
        // Optionally log the response
        setSerialLog((prev) => [...prev, `Sent: ${serialPayload}`]);
      })
      .catch((error) => console.error("Error sending serial:", error));
  };

  useEffect(() => {
    fetchAvailableSetups();
  }, []);

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
            <div>
              <Button
                style={{ marginBottom: "20px" }}
                variant="contained"
                onClick={reconnect}
              >
                Reconnect
              </Button>
            </div>
            <Typography variant="h6">Bluetooth Pairing</Typography>
            <div>
              <Button
                style={{ marginBottom: "20px" }}
                variant="contained"
                onClick={btConnect}
              >
                BT Pairing
              </Button>
            </div>
            <Typography variant="h6">Flash New Firmware</Typography>
            <div>
              <Button
                style={{ marginBottom: "20px" }}
                variant="contained"
                onClick={goToWebsite}
              >
                UC2-ESP32
              </Button>
            </div>
            <Box
        sx={{
          display: "flex",
          alignItems: "center",
          p: 1,
          gap: 1,
        }}
      >
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
            <Button
              style={{ marginBottom: "20px" }}
              variant="contained"
              onClick={handleSetSetup}
            >
              OK
            </Button>
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
          onChange={(e) => setSerialPayload(e.target.value)}
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
    



      {/* Tab 3: Serial CLI (example) */}
      <TabPanel value={tabIndex} index={3}>
        <Typography variant="h6">Configuration Editor</Typography>
        <Box mt={2}>
          <FormControl fullWidth style={{ marginBottom: "20px" }}>
            <InputLabel id="editor-select-label">Select a file to load</InputLabel>
            <Select
              labelId="editor-select-label"
              value={selectedFileForEdit}
              onChange={(e) => setSelectedFileForEdit(e.target.value)}
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
        </Box>
        <Box mt={2}>
          <Typography>Loaded file content:</Typography>
          {editorJson ? (
            <JsonEditor
              data={editorJson}
              setData={setEditorJson}
              style={{ height: "400px", overflow: "auto" }}
            />
          ) : (
            <Typography variant="body2">No file loaded.</Typography>
          )}
        </Box>
        <Box mt={2}>
          <TextField
            label="Save As Filename"
            fullWidth
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            style={{ marginBottom: "20px" }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={setAsCurrentConfig}
                onChange={(e) => setSetAsCurrentConfig(e.target.checked)}
              />
            }
            label="Set as Current Config"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={restartAfterSave}
                onChange={(e) => setRestartAfterSave(e.target.checked)}
              />
            }
            label="Restart After Save"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={overwriteFile}
                onChange={(e) => setOverwriteFile(e.target.checked)}
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

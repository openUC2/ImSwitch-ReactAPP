
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as connectionSettingsSlice from "../state/slices/ConnectionSettingsSlice.js";
import {
  Paper,
  Tabs,
  Tab,
  Box,
  Typography,
  Button,
  Grid,
  TextField,
} from "@mui/material";
import { useWebSocket } from "../context/WebSocketContext";
import * as uc2Slice from "../state/slices/UC2Slice.js";
/*
import {
  Preview as PreviewIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  AutoFixHigh as WizardIcon,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
import { JsonEditor } from "json-edit-react";
import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useWebSocket } from "../context/WebSocketContext.js";
import * as connectionSettingsSlice from "../state/slices/ConnectionSettingsSlice.js";
import {
  clearNotification,
  setNotification,
} from "../state/slices/NotificationSlice.js";
import * as uc2Slice from "../state/slices/UC2Slice.js";
import {
  createConfigurationPreview,
  validateConfiguration,
  validateJsonString,
} from "../utils/configValidation.js";
import ConfigurationPreviewDialog from "./ConfigurationPreviewDialog.js";
import ConfigurationWizard from "./ConfigurationWizard.js";

*/
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

const UC2Controller = () => {
  // Access ImSwitch backend connection settings from Redux - following Copilot Instructions
  const connectionSettingsState = useSelector(
    connectionSettingsSlice.getConnectionSettingsState
  );
  const hostIP = connectionSettingsState.ip;
  const hostPort = connectionSettingsState.apiPort;

  // Redux dispatcher
  const dispatch = useDispatch();
  const uc2State = useSelector(uc2Slice.getUc2State);

  const tabIndex = uc2State.tabIndex;
  const serialPayload = uc2State.serialPayload;
  const serialLog = uc2State.serialLog;
  const uc2Connected = uc2State.uc2Connected;

  const socket = useWebSocket();

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

  const restartImSwitch = () => {
    const url = `${hostIP}:${hostPort}/UC2ConfigController/restartImSwitch`;
    fetch(url)
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) => console.error("Error:", error));
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
    <Paper>
      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        aria-label="UC2 settings tabs"
      >
        <Tab label="Reconnect to UC2 board" />
        <Tab label="Serial CLI" />
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
    </Paper>
  );
};

export default UC2Controller;

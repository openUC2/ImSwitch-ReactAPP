import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setIp,
  setWebsocketPort,
  setApiPort,
} from "../state/slices/ConnectionSettingsSlice";
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Typography,
  Paper,
} from "@mui/material";

function ConnectionSettings() {
  const dispatch = useDispatch();
  const connectionSettings = useSelector(
    (state) => state.connectionSettingsState
  );

  // Local state, initialized from Redux
  const [hostProtocol, setHostProtocol] = useState(
    connectionSettings.ip?.startsWith("http://") ? "http://" : "https://"
  );
  const [hostIP, setHostIP] = useState(
    connectionSettings.ip?.replace(/^https?:\/\//, "") || ""
  );
  const [websocketPort, setWebsocketPortState] = useState(
    connectionSettings.websocketPort || ""
  );
  const [apiPort, setApiPortState] = useState(connectionSettings.apiPort || "");
  const [feedback, setFeedback] = useState("");

  // Handler
  const handleSave = () => {
    try {
      dispatch(setIp(`${hostProtocol}${hostIP}`));
      dispatch(setWebsocketPort(websocketPort));
      dispatch(setApiPort(apiPort));
      setFeedback("Settings saved!");
    } catch (e) {
      setFeedback("Error saving settings!");
    }
  };

  const isDirty =
    `${hostProtocol}${hostIP}` !== (connectionSettings.ip || "") ||
    websocketPort !== (connectionSettings.websocketPort || "") ||
    apiPort !== (connectionSettings.apiPort || "");

  return (
    <Paper elevation={2} sx={{ maxWidth: 600, p: 4, mt: 3, ml: 0 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Connection Settings
      </Typography>
      <Box
        component="form"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          alignItems: "flex-start",
        }}
        autoComplete="off"
      >
        <TextField
          select
          id="protocol"
          label="Protocol"
          value={hostProtocol}
          onChange={(e) => setHostProtocol(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="https://">https://</MenuItem>
          <MenuItem value="http://">http://</MenuItem>
        </TextField>
        <TextField
          id="ip-address"
          label="IP Address"
          type="text"
          value={hostIP}
          onChange={(e) =>
            setHostIP(e.target.value.trim().replace(/^https?:\/\//, ""))
          }
          sx={{ minWidth: 300 }}
        />
        <TextField
          id="port-websocket"
          label="Port (websocket)"
          type="text"
          value={websocketPort}
          onChange={(e) => setWebsocketPortState(e.target.value.trim())}
          sx={{ minWidth: 180 }}
        />
        <TextField
          id="port-api"
          label="Port (API)"
          type="text"
          value={apiPort}
          onChange={(e) => setApiPortState(e.target.value.trim())}
          sx={{ minWidth: 180 }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          sx={{ mt: 2, alignSelf: "flex-start" }}
          disabled={!isDirty}
        >
          Save
        </Button>
        {feedback && (
          <Typography variant="body2" color="green" sx={{ mt: 2 }}>
            {feedback}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

export default ConnectionSettings;

// src/components/WiFiController.js
import { Alert, Box, Button, Paper, Typography } from "@mui/material";
import { OpenInNew as OpenInNewIcon } from "@mui/icons-material";
import { useSelector } from "react-redux";
import * as connectionSettingsSlice from "../state/slices/ConnectionSettingsSlice.js";

const WiFiController = () => {
  // Access ImSwitch backend connection settings from Redux - following Copilot Instructions
  const connectionSettingsState = useSelector(
    connectionSettingsSlice.getConnectionSettingsState
  );
  const hostIP = connectionSettingsState.ip;

  // Construct Internet Access URL from backend connection settings
  // According to developer: if ImSwitch URL is {protocol}://{hostname}:8001/imswitch/index.html
  // then device-admin Internet Access page is {protocol}://{hostname}/admin/panel/internet
  const internetAccessUrl = `${hostIP}/admin/panel/internet`;

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Internet Access Configuration
      </Typography>
      <Typography
        variant="body2"
        color="textSecondary"
        gutterBottom
        sx={{ mb: 2 }}
      >
        Configure internet access and network settings for your device.
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        If the page doesn't load below due to security restrictions,
        <Button
          size="small"
          startIcon={<OpenInNewIcon />}
          onClick={() => window.open(internetAccessUrl, "_blank")}
          sx={{ ml: 1 }}
        >
          open it in a new tab
        </Button>
      </Alert>

      <Box
        sx={{
          width: "100%",
          height: "700px",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        <iframe
          src={internetAccessUrl}
          title="Internet Access Configuration"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
          }}
        />
      </Box>
    </Paper>
  );
};

export default WiFiController;

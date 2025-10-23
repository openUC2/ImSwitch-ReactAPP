import React from "react";
import { useSelector } from "react-redux";
import { getConnectionSettingsState } from "../state/slices/ConnectionSettingsSlice";
import * as uc2Slice from "../state/slices/UC2Slice.js"; // Add UC2 state for connection status
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Link,
  Paper,
  Divider,
  Alert,
} from "@mui/material";
import {
  Science,
  Computer,
  Code,
  GitHub,
  Launch,
  Public,
  Forum,
  Description,
  Web,
  CheckCircle,
  ErrorOutline,
} from "@mui/icons-material";

/**
 * AboutPage Component - Enhanced version with modern UI
 */
const AboutPage = () => {
  // Redux state management
  const connectionSettings = useSelector(getConnectionSettingsState);
  const uc2State = useSelector(uc2Slice.getUc2State);
  const isBackendConnected = uc2State.uc2Connected;

  const hostIP = connectionSettings.ip || "http://localhost";
  const hostPort = connectionSettings.apiPort || "8000";
  const apiDocsUrl = `${hostIP}:${hostPort}/docs`;

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          About the Microscope Control Software
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Open-source software designed to control microscopes using a modular
          and extensible approach
        </Typography>
      </Box>

      {/* Main Description Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Science color="primary" />
            <Typography variant="h6">ImSwitch Platform</Typography>
            <Chip
              label="Open Source"
              color="success"
              size="small"
              variant="outlined"
            />
          </Box>

          <Typography variant="body1" gutterBottom>
            This application is an open-source software designed to control
            microscopes using a modular and extensible approach. It seamlessly
            integrates advanced features to empower researchers and educators in
            the microscopy domain.
          </Typography>

          {/* App Version */}
          <Paper sx={{ p: 2, bgcolor: "background.default", mt: 2 }}>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <Web fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="App Version"
                  secondary={`Version: ${
                    process.env.REACT_APP_VERSION || "Unknown"
                  }`}
                />
              </ListItem>
            </List>
          </Paper>
        </CardContent>
      </Card>

      {/* Source Code Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <GitHub color="secondary" />
            <Typography variant="h6">Source Code</Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            The source code for this React application can be found in our
            GitHub repository:
          </Typography>

          <List dense>
            <ListItem>
              <ListItemIcon>
                <Code fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Link
                    href="https://github.com/openUC2/imswitch-aiortc-react"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    openUC2/imswitch-aiortc-react
                    <Launch fontSize="small" />
                  </Link>
                }
                secondary="React frontend for ImSwitch microscope control"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Backend Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Computer color="info" />
            <Typography variant="h6">Backend</Typography>
            <Chip
              label={isBackendConnected ? "Connected" : "Disconnected"}
              color={isBackendConnected ? "success" : "error"}
              size="small"
              variant="outlined"
            />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            The backend is based on the openUC2 fork of ImSwitch. You can find
            it here:
          </Typography>

          <List dense>
            <ListItem>
              <ListItemIcon>
                <GitHub fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Link
                    href="https://github.com/openUC2/imswitch"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    openUC2/imswitch
                    <Launch fontSize="small" />
                  </Link>
                }
                secondary="ImSwitch backend based on openUC2 fork"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Description fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="REST API Documentation"
                secondary={
                  <Box sx={{ mt: 1 }}>
                    {/* Connection-aware API documentation section */}
                    {isBackendConnected ? (
                      // Backend is connected - show clickable link
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CheckCircle fontSize="small" color="success" />
                        <Box
                          component="code"
                          sx={{
                            p: 0.5,
                            borderRadius: 1,
                            fontSize: "0.875rem",
                          }}
                        >
                          <Link
                            href={apiDocsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            {apiDocsUrl}
                            <Launch fontSize="small" />
                          </Link>
                        </Box>
                      </Box>
                    ) : (
                      // Backend is not connected - show info with example
                      <Box>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <ErrorOutline fontSize="small" />
                            <Typography variant="body2">
                              Backend not connected. Configure connection
                              settings to access API documentation.
                            </Typography>
                          </Box>
                        </Alert>
                        <Box sx={{ mt: 1 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            API documentation will be available at:
                          </Typography>
                          <Box
                            component="code"
                            sx={{
                              p: 0.5,
                              borderRadius: 1,
                              fontSize: "0.875rem",
                              color: "text.secondary",
                              display: "block",
                            }}
                          >
                            {apiDocsUrl}
                          </Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              mt: 1,
                              display: "block",
                            }}
                          >
                            Example: http://localhost:8000/docs or
                            http://192.168.1.100:8000/docs
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                }
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Community and Support Card */}
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Public color="warning" />
            <Typography variant="h6">Community and Support</Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Reach out to us on our forum for discussions and support:
          </Typography>

          <List dense>
            <ListItem>
              <ListItemIcon>
                <Forum fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Link
                    href="https://openuc2.discourse.group"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    openuc2.discourse.group
                    <Launch fontSize="small" />
                  </Link>
                }
                secondary="Community forum for discussions and support"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Public fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Link
                    href="http://openuc2.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    openuc2.com
                    <Launch fontSize="small" />
                  </Link>
                }
                secondary="Learn more about us on our official website"
              />
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Chip label="Modular Design" size="small" />
            <Chip label="Extensible" size="small" />
            <Chip label="Research Focused" size="small" />
            <Chip label="Educational" size="small" />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AboutPage;

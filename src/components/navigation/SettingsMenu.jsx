import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  Tooltip,
  Typography,
  Box,
  Switch,
} from "@mui/material";
import {
  Settings,
  DarkMode,
  LightMode,
  Wifi,
  Info,
  Memory,
  Cable,
  Tune,
  Computer,
  SystemUpdate,
} from "@mui/icons-material";

// Redux state management following Copilot Instructions
import { toggleTheme, getThemeState } from "../../state/slices/ThemeSlice.js";
import * as connectionSettingsSlice from "../../state/slices/ConnectionSettingsSlice.js";
import * as uc2Slice from "../../state/slices/UC2Slice.js";

/**
 * ImSwitch Settings Menu Component
 * Following Copilot Instructions for API communication patterns
 * All backend-dependent features disabled when connection unavailable
 */
const SettingsMenu = ({ onNavigate }) => {
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const { isDarkMode } = useSelector(getThemeState);
  const connectionSettings = useSelector(
    connectionSettingsSlice.getConnectionSettingsState
  );

  // Get actual backend connection status from UC2 slice - following Copilot Instructions
  const uc2State = useSelector(uc2Slice.getUc2State);
  const isBackendConnected = uc2State.uc2Connected;

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Handle navigation items (close menu)
  const handleNavigationClick = (pluginName) => {
    handleClose();
    if (onNavigate) {
      onNavigate(pluginName);
    }
  };

  // Handle theme toggle (keep menu open)
  const handleThemeToggle = (event) => {
    event.stopPropagation(); // Prevent menu close
    dispatch(toggleTheme());
  };

  // Check if connection settings are configured
  const hasConnectionSettings =
    connectionSettings.ip && connectionSettings.apiPort;

  return (
    <>
      <Tooltip title="Settings & Configuration">
        <IconButton
          color="inherit"
          onClick={handleClick}
          sx={{ ml: 1 }}
          aria-label="settings menu"
        >
          <Badge
            color={
              isBackendConnected
                ? "success"
                : hasConnectionSettings
                ? "error"
                : "warning"
            }
            variant="dot"
            sx={{
              "& .MuiBadge-badge": {
                right: 2,
                top: 2,
                width: 8,
                height: 8,
              },
            }}
          >
            <Settings />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 250,
            "& .MuiMenuItem-root": {
              px: 2,
              py: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {/* Connection Status Header */}
        <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="body2" color="text.secondary">
            ImSwitch Backend
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            {isBackendConnected ? (
              <Box component="span" color="success.main">
                ● Connected
              </Box>
            ) : hasConnectionSettings ? (
              <Box component="span" color="error.main">
                ● Connection Failed
              </Box>
            ) : (
              <Box component="span" color="warning.main">
                ● Not Configured
              </Box>
            )}
          </Typography>
          {hasConnectionSettings && (
            <Typography variant="caption" color="text.secondary">
              {connectionSettings.ip}:{connectionSettings.apiPort}
            </Typography>
          )}
          {!hasConnectionSettings && (
            <Typography variant="caption" color="text.secondary">
              Click "Backend Connection" to configure
            </Typography>
          )}
        </Box>

        {/* Theme Toggle - Always available (local frontend state) */}
        <MenuItem onClick={handleThemeToggle}>
          <ListItemIcon>
            {isDarkMode ? (
              <LightMode fontSize="small" />
            ) : (
              <DarkMode fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText primary="Dark Mode" />
          <Switch
            checked={isDarkMode}
            onChange={handleThemeToggle}
            size="small"
            onClick={(e) => e.stopPropagation()}
          />
        </MenuItem>

        <Divider />

        {/* Backend Connection - Always available (needed to establish connection) */}
        <MenuItem onClick={() => handleNavigationClick("Connections")}>
          <ListItemIcon>
            <Cable
              fontSize="small"
              color={
                isBackendConnected
                  ? "success"
                  : hasConnectionSettings
                  ? "error"
                  : "warning"
              }
            />
          </ListItemIcon>
          <ListItemText
            primary="Backend Connection"
            secondary={
              isBackendConnected
                ? "Connected - Configure settings"
                : hasConnectionSettings
                ? "Connection failed - Check settings"
                : "Setup required"
            }
          />
        </MenuItem>

        {/* Backend-Dependent Items - Following Copilot Instructions for API communication */}

        {/* System Settings - Requires backend API calls */}
        <MenuItem
          onClick={() => handleNavigationClick("SystemSettings")}
          disabled={!isBackendConnected}
          sx={{
            opacity: isBackendConnected ? 1 : 0.5,
            "&.Mui-disabled": {
              opacity: 0.5,
            },
          }}
        >
          <ListItemIcon>
            <Tune
              fontSize="small"
              color={isBackendConnected ? "inherit" : "disabled"}
            />
          </ListItemIcon>
          <ListItemText
            primary="System Settings"
            secondary={
              isBackendConnected
                ? "Hardware configuration"
                : "Requires backend connection"
            }
          />
        </MenuItem>

        {/* ImSwitch Backend Settings */}
        <MenuItem
          onClick={() => handleNavigationClick("UC2")}
          disabled={!isBackendConnected}
          sx={{
            opacity: isBackendConnected ? 1 : 0.5,
            "&.Mui-disabled": {
              opacity: 0.5,
            },
          }}
        >
          <ListItemIcon>
            <Memory
              fontSize="small"
              color={isBackendConnected ? "inherit" : "disabled"}
            />
          </ListItemIcon>
          <ListItemText
            primary="ImSwitch Backend Settings"
            secondary={
              isBackendConnected
                ? "Microscope configuration"
                : "Requires backend connection"
            }
          />
        </MenuItem>

        {/* WiFi Configuration - Requires backend API calls for network management */}
        <MenuItem
          onClick={() => handleNavigationClick("WiFi")}
          disabled={!isBackendConnected}
          sx={{
            opacity: isBackendConnected ? 1 : 0.5,
            "&.Mui-disabled": {
              opacity: 0.5,
            },
          }}
        >
          <ListItemIcon>
            <Wifi
              fontSize="small"
              color={isBackendConnected ? "inherit" : "disabled"}
            />
          </ListItemIcon>
          <ListItemText
            primary="WiFi Configuration"
            secondary={
              isBackendConnected
                ? "Network setup"
                : "Requires backend connection"
            }
          />
        </MenuItem>

        <Divider />

        {/* Socket View - Requires backend connection for debugging */}
        <MenuItem
          onClick={() => handleNavigationClick("SocketView")}
          disabled={!isBackendConnected}
          sx={{
            opacity: isBackendConnected ? 1 : 0.5,
            "&.Mui-disabled": {
              opacity: 0.5,
            },
          }}
        >
          <ListItemIcon>
            <Computer
              fontSize="small"
              color={isBackendConnected ? "inherit" : "disabled"}
            />
          </ListItemIcon>
          <ListItemText
            primary="Socket View"
            secondary={
              isBackendConnected
                ? "Debug connections"
                : "Requires backend connection"
            }
          />
        </MenuItem>

        {/* System Updates */}
        <MenuItem
          onClick={() => handleNavigationClick("SystemUpdate")}
          disabled={!isBackendConnected}
          sx={{
            opacity: isBackendConnected ? 1 : 0.5,
            "&.Mui-disabled": {
              opacity: 0.5,
            },
          }}
        >
          <ListItemIcon>
            <SystemUpdate
              fontSize="small"
              color={isBackendConnected ? "inherit" : "disabled"}
            />
          </ListItemIcon>
          <ListItemText
            primary="System Updates"
            secondary={
              isBackendConnected
                ? "Update system & firmware"
                : "Requires backend connection"
            }
          />
        </MenuItem>

        <Divider />

        {/* About - Always available (static information) */}
        <MenuItem onClick={() => handleNavigationClick("About")}>
          <ListItemIcon>
            <Info fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="About ImSwitch"
            secondary="Version & information"
          />
        </MenuItem>
      </Menu>
    </>
  );
};

export default SettingsMenu;

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
} from "@mui/icons-material";

// Redux state management
import { toggleTheme, getThemeState } from "../../state/slices/ThemeSlice.js";
import * as connectionSettingsSlice from "../../state/slices/ConnectionSettingsSlice.js";
import * as uc2Slice from "../../state/slices/UC2Slice.js";

/**
 * ImSwitch Settings Menu Component
 * Uses UC2 connection state for accurate backend status
 */
const SettingsMenu = ({ onNavigate }) => {
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const { isDarkMode } = useSelector(getThemeState);
  const connectionSettings = useSelector(
    connectionSettingsSlice.getConnectionSettingsState
  );

  // Get actual backend connection status from UC2 slice
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
            color={isBackendConnected ? "success" : "error"}
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

        {/* Theme Toggle - Keeps menu open */}
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
            onClick={(e) => e.stopPropagation()} // Prevent double toggle
          />
        </MenuItem>

        <Divider />

        {/* Navigation items - Close menu after click */}
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

        <MenuItem onClick={() => handleNavigationClick("SystemSettings")}>
          <ListItemIcon>
            <Tune fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="System Settings"
            secondary="Hardware configuration"
          />
        </MenuItem>

        <MenuItem onClick={() => handleNavigationClick("UC2")}>
          <ListItemIcon>
            <Memory fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="UC2 Settings"
            secondary="Hardware configuration"
          />
        </MenuItem>

        <MenuItem onClick={() => handleNavigationClick("WiFi")}>
          <ListItemIcon>
            <Wifi fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="WiFi Configuration"
            secondary="Network setup"
          />
        </MenuItem>

        <Divider />

        <MenuItem onClick={() => handleNavigationClick("SocketView")}>
          <ListItemIcon>
            <Computer fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Socket View" secondary="Debug connections" />
        </MenuItem>

        <Divider />

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

// src/components/AppManager/AppManagerModal.jsx
// Modal wrapper for the App Manager component
// Provides a full-screen dialog interface for managing ImSwitch applications

import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Dialog, DialogContent, useMediaQuery, useTheme } from "@mui/material";

// Redux imports
import {
  selectIsAppManagerOpen,
  closeAppManager,
} from "../../state/slices/appManagerSlice";

// Component imports
import AppManager from "./AppManager.jsx";

/**
 * Modal wrapper for the App Manager
 * Provides a responsive dialog interface
 */
const AppManagerModal = ({ onNavigateToApp }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  // Redux state
  const isOpen = useSelector(selectIsAppManagerOpen);

  // Event handlers
  const handleClose = () => {
    dispatch(closeAppManager());
  };

  const handleLaunchApp = (app) => {
    // Close modal first, then navigate
    handleClose();
    // Navigate to app if handler provided
    if (onNavigateToApp && app.pluginId) {
      // Small delay to allow modal to close smoothly
      setTimeout(() => {
        onNavigateToApp(app.pluginId);
      }, 100);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      fullScreen={fullScreen}
      maxWidth="lg"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          height: fullScreen ? "100vh" : "90vh",
          m: fullScreen ? 0 : 2,
        },
      }}
    >
      <DialogContent sx={{ p: 0, height: "100%" }}>
        <AppManager onNavigateToApp={handleLaunchApp} />
      </DialogContent>
    </Dialog>
  );
};

export default AppManagerModal;

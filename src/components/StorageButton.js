import React, { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  Chip,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  SdStorage as SdStorageIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { setNotification } from "../state/slices/NotificationSlice";
import apiStorageControllerListExternalDrives from "../backendapi/apiStorageControllerListExternalDrives";
import apiStorageControllerGetStorageStatus from "../backendapi/apiStorageControllerGetStorageStatus";
import apiStorageControllerSetActivePath from "../backendapi/apiStorageControllerSetActivePath";

/**
 * StorageButton Component
 *
 * Top bar button with auto-detection of external drives.
 * Shows badge with number of available drives and opens popover for management.
 *
 * @param {function} onStorageChange - Callback when storage location changes
 * @param {number} scanInterval - Interval for background scanning in ms (default: 10000)
 */
const StorageButton = ({ onStorageChange, scanInterval = 10000 }) => {
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState(null);
  const [externalDrives, setExternalDrives] = useState([]);
  const [storageStatus, setStorageStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mounting, setMounting] = useState(null);
  const [previousDriveCount, setPreviousDriveCount] = useState(0);

  const open = Boolean(anchorEl);

  // Format size in human-readable format
  const formatSize = (bytes) => {
    if (!bytes) return "Unknown";
    const gb = bytes / 1024 ** 3;
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / 1024 ** 2;
    return `${mb.toFixed(2)} MB`;
  };

  // Fetch storage status and external drives
  const fetchStorageInfo = useCallback(
    async (showLoading = true) => {
      console.log(
        "StorageButton: fetchStorageInfo called, showLoading:",
        showLoading
      );
      if (showLoading) setLoading(true);
      setError(null);

      try {
        // Get current storage status
        console.log("StorageButton: Fetching storage status...");
        const status = await apiStorageControllerGetStorageStatus();
        console.log("StorageButton: Storage status:", status);
        setStorageStatus(status);

        // Get list of external drives
        console.log("StorageButton: Fetching external drives...");
        const drives = await apiStorageControllerListExternalDrives();
        console.log("StorageButton: Raw API response:", drives);
        const newDrives = drives.drives || [];

        console.log(
          "StorageButton: Scanned drives:",
          newDrives.length,
          newDrives
        );

        // Check for new drives
        if (newDrives.length > previousDriveCount && previousDriveCount > 0) {
          const newDrive = newDrives[newDrives.length - 1];
          dispatch(
            setNotification({
              message: `New drive detected: ${newDrive.label || newDrive.path}`,
              type: "info",
            })
          );
        }

        setExternalDrives(newDrives);
        setPreviousDriveCount(newDrives.length);
      } catch (err) {
        console.error("Failed to fetch storage info:", err);
        if (showLoading) {
          setError("Failed to load storage information.");
        }
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [previousDriveCount]
  );

  // Mount/activate a drive
  const handleMountDrive = async (drivePath, persist = true) => {
    setMounting(drivePath);
    setError(null);

    try {
      const result = await apiStorageControllerSetActivePath(
        drivePath,
        persist
      );

      // Backend returns success message directly or in result object
      await fetchStorageInfo(false);

      if (onStorageChange) {
        onStorageChange(result.active_path || drivePath);
      }

      dispatch(
        setNotification({
          message: result.message || `Storage mounted successfully`,
          type: "success",
        })
      );
    } catch (err) {
      console.error("Failed to mount drive:", err);
      setError(`Failed to mount drive: ${err.message}`);
    } finally {
      setMounting(null);
    }
  };

  // Handle button click
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    fetchStorageInfo();
  };

  const handleClose = () => {
    setAnchorEl(null);
    setError(null);
  };

  // Initial load
  useEffect(() => {
    console.log("StorageButton: Initial mount, starting scan...");
    fetchStorageInfo(false);
  }, [fetchStorageInfo]);

  // Background scanning
  useEffect(() => {
    console.log(
      "StorageButton: Setting up background scan every",
      scanInterval / 1000,
      "seconds"
    );
    const interval = setInterval(() => {
      fetchStorageInfo(false);
    }, scanInterval);

    return () => clearInterval(interval);
  }, [scanInterval, fetchStorageInfo]);

  return (
    <>
      <IconButton
        onClick={handleClick}
        title="Storage Management"
        size="small"
        sx={{ color: "inherit" }}
      >
        <Badge badgeContent={externalDrives.length} color="primary">
          <SdStorageIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Box sx={{ width: 400, maxHeight: 500, overflow: "auto" }}>
          {/* Header */}
          <Box
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Typography
              variant="h6"
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <SdStorageIcon /> Storage
            </Typography>
            <Box>
              <IconButton
                size="small"
                onClick={() => fetchStorageInfo()}
                disabled={loading}
              >
                <RefreshIcon />
              </IconButton>
              <IconButton size="small" onClick={handleClose}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {error && (
            <Box
              sx={{
                m: 2,
                p: 2,
                bgcolor: "error.main",
                color: "error.contrastText",
                borderRadius: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="body2">{error}</Typography>
              <IconButton
                size="small"
                onClick={() => setError(null)}
                sx={{ color: "inherit" }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}

          {/* Current Active Storage */}
          {storageStatus && (
            <Box
              sx={{
                p: 2,
                bgcolor: "primary.main",
                color: "primary.contrastText",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CheckCircleIcon fontSize="small" />
                <Typography variant="subtitle2" component="div">
                  Active Location
                </Typography>
              </Box>
              <Typography
                variant="body2"
                component="div"
                sx={{ mt: 1, fontFamily: "monospace", fontSize: "0.85rem" }}
              >
                {storageStatus.active_path || "Not set"}
              </Typography>
              {storageStatus.disk_usage && (
                <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                  <Chip
                    label={`Free: ${formatSize(storageStatus.disk_usage.free)}`}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255, 255, 255, 0.2)",
                      color: "inherit",
                    }}
                  />
                  <Chip
                    label={`Total: ${formatSize(
                      storageStatus.disk_usage.total
                    )}`}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255, 255, 255, 0.2)",
                      color: "inherit",
                    }}
                  />
                </Box>
              )}
            </Box>
          )}

          <Divider />

          {/* External Drives */}
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
              External Drives ({externalDrives.length})
            </Typography>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : externalDrives.length === 0 ? (
              <Box sx={{ mt: 1, p: 2, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  No external drives detected.
                </Typography>
              </Box>
            ) : (
              <List dense>
                {externalDrives.map((drive, index) => {
                  const isActive =
                    storageStatus?.active_path?.startsWith(drive.path) ||
                    drive.is_active;
                  const isMounting = mounting === drive.path;

                  return (
                    <ListItem
                      key={index}
                      disablePadding
                      sx={{ mb: 1 }}
                      secondaryAction={
                        <Button
                          variant={isActive ? "outlined" : "contained"}
                          color={isActive ? "success" : "primary"}
                          size="small"
                          onClick={() => handleMountDrive(drive.path, true)}
                          disabled={isActive || isMounting}
                          startIcon={
                            isMounting ? <CircularProgress size={12} /> : null
                          }
                        >
                          {isActive
                            ? "Active"
                            : isMounting
                            ? "Mounting..."
                            : "Mount"}
                        </Button>
                      }
                    >
                      <ListItemButton
                        disabled={isActive}
                        sx={{ borderRadius: 1 }}
                      >
                        <ListItemIcon>
                          <SdStorageIcon
                            color={isActive ? "success" : "action"}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={drive.label || drive.path}
                          secondary={
                            <>
                              <Typography
                                variant="caption"
                                component="span"
                                sx={{ display: "block" }}
                              >
                                {drive.path}
                              </Typography>
                              <Box
                                component="span"
                                sx={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                  flexWrap: "wrap",
                                  mt: 0.5,
                                }}
                              >
                                {(drive.free_space_gb ||
                                  drive.total_space_gb) && (
                                  <Chip
                                    label={`${
                                      drive.free_space_gb?.toFixed(1) || "?"
                                    } / ${
                                      drive.total_space_gb?.toFixed(1) || "?"
                                    } GB`}
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                                {drive.filesystem && (
                                  <Chip
                                    label={drive.filesystem}
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            </>
                          }
                          secondaryTypographyProps={{ component: "div" }}
                        />
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export default StorageButton;

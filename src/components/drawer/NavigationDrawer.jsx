import { useState } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Tooltip,
  Avatar,
  Divider,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Build as BuildIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  SettingsOverscanSharp as SettingsOverscanSharpIcon,
  AccessTime as AccessTimeIcon,
  ExpandLess,
  ExpandMore,
  Apps as AppsIcon,
  Code as CodeIcon,
  Computer as ComputerIcon,
  Folder as FolderIcon,
  Extension as ExtensionIcon,
  Science as ScienceIcon,
  WifiSharp as WifiSharpIcon,
  ThreeDRotation as ThreeDRotationIcon,
  Air as AirIcon,
  Straighten as StraightenIcon,
  Memory as MemoryIcon,
  SportsEsports as SportsEsportsIcon,
  Link as LinkIcon,
  Comment as CommentIcon,
  ZoomOutMap as ZoomOutMapIcon,
  Sensors as SensorsIcon,
  BlurOn as BlurOnIcon,
} from "@mui/icons-material";
import * as Icons from "@mui/icons-material";
import SIDEBAR_COLORS from "../../constants/sidebarColors.js";
import DrawerHeader from "./DrawerHeader.jsx";

/**
 * ImSwitch Navigation Drawer Component
 * Main navigation sidebar for microscopy control interface
 * Follows Copilot Instructions for component extraction and modularity
 * Manages its own UI state (groupsOpen) instead of relying on App.jsx
 */
const NavigationDrawer = ({
  // Drawer state
  sidebarVisible,
  setSidebarVisible,
  isMobile,
  drawerWidth,

  // Navigation state
  selectedPlugin,
  handlePluginChange,

  // Dynamic plugins
  plugins = [],
}) => {
  // Internal state management for drawer groups - following Copilot Instructions
  const [groupsOpen, setGroupsOpen] = useState(() => {
    // Restore from localStorage if available, otherwise start collapsed
    try {
      const saved = localStorage.getItem("imswitch.groupsOpen");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // Ignore JSON/localStorage errors
    }
    return {
      apps: false,
      coding: false,
      system: false,
      systemSettings: false,
    };
  });

  // Internal toggle function - encapsulated navigation logic
  const toggleGroup = (groupName) => {
    setGroupsOpen((prev) => {
      const next = {
        ...prev,
        [groupName]: !prev[groupName],
      };
      // Persist the open/closed state for ImSwitch session
      try {
        localStorage.setItem("imswitch.groupsOpen", JSON.stringify(next));
      } catch (e) {
        // Ignore storage errors
      }
      return next;
    });
  };

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={sidebarVisible}
      onClose={() => setSidebarVisible(false)}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
      }}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        zIndex: (theme) => theme.zIndex.drawer + 3,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          zIndex: (theme) => theme.zIndex.drawer + 3,
          transition: (theme) =>
            theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <DrawerHeader
        sidebarVisible={sidebarVisible}
        setSidebarVisible={setSidebarVisible}
        isMobile={isMobile}
      />

      <List>
        {/* LiveView - Main microscopy interface */}
        <ListItem>
          <Tooltip title="Live View" placement="right">
            <ListItemButton
              selected={selectedPlugin === "LiveView"}
              onClick={() => handlePluginChange("LiveView")}
            >
              <ListItemIcon>
                <DashboardIcon sx={{ color: SIDEBAR_COLORS.liveView }} />
              </ListItemIcon>
              <ListItemText primary={sidebarVisible ? "Live View" : ""} />
            </ListItemButton>
          </Tooltip>
        </ListItem>
        <Divider sx={{ my: 1 }} />

        {/* Apps Group - Microscopy Applications */}
        <ListItem>
          <Tooltip title="Apps" placement="right">
            <ListItemButton onClick={() => toggleGroup("apps")}>
              <ListItemIcon>
                <AppsIcon sx={{ color: SIDEBAR_COLORS.apps }} />
              </ListItemIcon>
              <ListItemText primary={sidebarVisible ? "Apps" : ""} />
              {sidebarVisible &&
                (groupsOpen.apps ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
          </Tooltip>
        </ListItem>
        <Collapse in={groupsOpen.apps} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {/* WellPlate - Multi-well microscopy */}
            <ListItem>
              <Tooltip
                title="WellPlate"
                placement="right"
                disableHoverListener={sidebarVisible}
              >
                <ListItemButton
                  selected={selectedPlugin === "WellPlate"}
                  onClick={() => handlePluginChange("WellPlate")}
                  sx={{
                    justifyContent: sidebarVisible ? "flex-start" : "center",
                    minHeight: 48,
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: sidebarVisible ? 3 : "auto",
                      justifyContent: "center",
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: SIDEBAR_COLORS.apps,
                        width: 24,
                        height: 24,
                        fontSize: 14,
                      }}
                    >
                      WP
                    </Avatar>
                  </ListItemIcon>
                  {sidebarVisible && (
                    <ListItemText primary="WellPlate" sx={{ opacity: 1 }} />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>

            {/* HistoScan - Automated scanning */}
            <ListItem>
              <Tooltip
                title="HistoScan"
                placement="right"
                disableHoverListener={sidebarVisible}
              >
                <ListItemButton
                  selected={selectedPlugin === "HistoScan"}
                  onClick={() => handlePluginChange("HistoScan")}
                  sx={{
                    justifyContent: sidebarVisible ? "flex-start" : "center",
                    minHeight: 48,
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: sidebarVisible ? 3 : "auto",
                      justifyContent: "center",
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: SIDEBAR_COLORS.apps,
                        width: 24,
                        height: 24,
                        fontSize: 14,
                      }}
                    >
                      HS
                    </Avatar>
                  </ListItemIcon>
                  {sidebarVisible && (
                    <ListItemText primary="HistoScan" sx={{ opacity: 1 }} />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>

            {/* STORM Local - Super-resolution microscopy */}
            <ListItem>
              <Tooltip
                title="STORM Local"
                placement="right"
                disableHoverListener={sidebarVisible}
              >
                <ListItemButton
                  selected={selectedPlugin === "STORMLocal"}
                  onClick={() => handlePluginChange("STORMLocal")}
                  sx={{
                    justifyContent: sidebarVisible ? "flex-start" : "center",
                    minHeight: 48,
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: sidebarVisible ? 3 : "auto",
                      justifyContent: "center",
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: SIDEBAR_COLORS.apps,
                        width: 24,
                        height: 24,
                        fontSize: 14,
                      }}
                    >
                      SL
                    </Avatar>
                  </ListItemIcon>
                  {sidebarVisible && (
                    <ListItemText primary="STORM Local" sx={{ opacity: 1 }} />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>

            {/* STORM Arkitekt */}
            <ListItem>
              <Tooltip
                title="STORM Arkitekt"
                placement="right"
                disableHoverListener={sidebarVisible}
              >
                <ListItemButton
                  selected={selectedPlugin === "STORMArkitekt"}
                  onClick={() => handlePluginChange("STORMArkitekt")}
                  sx={{
                    justifyContent: sidebarVisible ? "flex-start" : "center",
                    minHeight: 48,
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: sidebarVisible ? 3 : "auto",
                      justifyContent: "center",
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: SIDEBAR_COLORS.apps,
                        width: 24,
                        height: 24,
                        fontSize: 14,
                      }}
                    >
                      SA
                    </Avatar>
                  </ListItemIcon>
                  {sidebarVisible && (
                    <ListItemText
                      primary="STORM Arkitekt"
                      sx={{ opacity: 1 }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>

            {/* Infinity Scanning */}
            <ListItem>
              <Tooltip
                title="Infinity Scanning"
                placement="right"
                disableHoverListener={sidebarVisible}
              >
                <ListItemButton
                  selected={selectedPlugin === "Infinity Scanning"}
                  onClick={() => handlePluginChange("Infinity Scanning")}
                  sx={{
                    justifyContent: sidebarVisible ? "flex-start" : "center",
                    minHeight: 48,
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: sidebarVisible ? 3 : "auto",
                      justifyContent: "center",
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: SIDEBAR_COLORS.apps,
                        width: 24,
                        height: 24,
                        fontSize: 14,
                      }}
                    >
                      IS
                    </Avatar>
                  </ListItemIcon>
                  {sidebarVisible && (
                    <ListItemText
                      primary="Infinity Scanning"
                      sx={{ opacity: 1 }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>

            {/* LightSheet - 3D microscopy */}
            <ListItem>
              <Tooltip
                title="LightSheet"
                placement="right"
                disableHoverListener={sidebarVisible}
              >
                <ListItemButton
                  selected={selectedPlugin === "LightSheet"}
                  onClick={() => handlePluginChange("LightSheet")}
                  sx={{
                    justifyContent: sidebarVisible ? "flex-start" : "center",
                    minHeight: 48,
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: sidebarVisible ? 3 : "auto",
                      justifyContent: "center",
                    }}
                  >
                    <ThreeDRotationIcon sx={{ color: SIDEBAR_COLORS.apps }} />
                  </ListItemIcon>
                  {sidebarVisible && (
                    <ListItemText primary="LightSheet" sx={{ opacity: 1 }} />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>

            {/* Demo Application */}
            <ListItem>
              <Tooltip
                title="Demo"
                placement="right"
                disableHoverListener={sidebarVisible}
              >
                <ListItemButton
                  selected={selectedPlugin === "Demo"}
                  onClick={() => handlePluginChange("Demo")}
                  sx={{
                    justifyContent: sidebarVisible ? "flex-start" : "center",
                    minHeight: 48,
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: sidebarVisible ? 3 : "auto",
                      justifyContent: "center",
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: SIDEBAR_COLORS.apps,
                        width: 24,
                        height: 24,
                        fontSize: 14,
                      }}
                    >
                      DM
                    </Avatar>
                  </ListItemIcon>
                  {sidebarVisible && (
                    <ListItemText primary="Demo" sx={{ opacity: 1 }} />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>

            {/* Timelapse - Time-series microscopy */}
            <ListItem>
              <Tooltip
                title="Timelapse"
                placement="right"
                disableHoverListener={sidebarVisible}
              >
                <ListItemButton
                  selected={selectedPlugin === "Timelapse"}
                  onClick={() => handlePluginChange("Timelapse")}
                  sx={{
                    justifyContent: sidebarVisible ? "flex-start" : "center",
                    minHeight: 48,
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: sidebarVisible ? 3 : "auto",
                      justifyContent: "center",
                    }}
                  >
                    <AccessTimeIcon sx={{ color: SIDEBAR_COLORS.apps }} />
                  </ListItemIcon>
                  {sidebarVisible && (
                    <ListItemText primary="Timelapse" sx={{ opacity: 1 }} />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>

            {/* FlowStop - Flow control */}
            <ListItem>
              <Tooltip
                title="FlowStop"
                placement="right"
                disableHoverListener={sidebarVisible}
              >
                <ListItemButton
                  selected={selectedPlugin === "FlowStop"}
                  onClick={() => handlePluginChange("FlowStop")}
                  sx={{
                    justifyContent: sidebarVisible ? "flex-start" : "center",
                    minHeight: 48,
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: sidebarVisible ? 3 : "auto",
                      justifyContent: "center",
                    }}
                  >
                    <AirIcon sx={{ color: SIDEBAR_COLORS.apps }} />
                  </ListItemIcon>
                  {sidebarVisible && (
                    <ListItemText primary="FlowStop" sx={{ opacity: 1 }} />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>

            {/* Lepmon */}
            <ListItem>
              <Tooltip
                title="Lepmon"
                placement="right"
                disableHoverListener={sidebarVisible}
              >
                <ListItemButton
                  selected={selectedPlugin === "Lepmon"}
                  onClick={() => handlePluginChange("Lepmon")}
                  sx={{
                    justifyContent: sidebarVisible ? "flex-start" : "center",
                    minHeight: 48,
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: sidebarVisible ? 3 : "auto",
                      justifyContent: "center",
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: SIDEBAR_COLORS.apps,
                        width: 24,
                        height: 24,
                        fontSize: 14,
                      }}
                    >
                      LM
                    </Avatar>
                  </ListItemIcon>
                  {sidebarVisible && (
                    <ListItemText primary="Lepmon" sx={{ opacity: 1 }} />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>

            {/* Maze Game */}
            <ListItem>
              <Tooltip
                title="Maze Game"
                placement="right"
                disableHoverListener={sidebarVisible}
              >
                <ListItemButton
                  selected={selectedPlugin === "MazeGame"}
                  onClick={() => handlePluginChange("MazeGame")}
                  sx={{
                    justifyContent: sidebarVisible ? "flex-start" : "center",
                    minHeight: 48,
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: sidebarVisible ? 3 : "auto",
                      justifyContent: "center",
                    }}
                  >
                    <SportsEsportsIcon sx={{ color: SIDEBAR_COLORS.apps }} />
                  </ListItemIcon>
                  {sidebarVisible && (
                    <ListItemText primary="Maze Game" sx={{ opacity: 1 }} />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          </List>
        </Collapse>
        <Divider sx={{ my: 1 }} />

        {/* File Manager - Microscopy data management */}
        <ListItem>
          <ListItemButton
            selected={selectedPlugin === "FileManager"}
            onClick={() => handlePluginChange("FileManager")}
          >
            <ListItemIcon>
              <FolderIcon sx={{ color: SIDEBAR_COLORS.fileManager }} />
            </ListItemIcon>
            <ListItemText primary={sidebarVisible ? "File Manager" : ""} />
          </ListItemButton>
        </ListItem>
        <Divider sx={{ my: 1 }} />

        {/* Coding Group - Programming tools */}
        <ListItem>
          <ListItemButton onClick={() => toggleGroup("coding")}>
            <ListItemIcon>
              <CodeIcon sx={{ color: SIDEBAR_COLORS.coding }} />
            </ListItemIcon>
            <ListItemText primary={sidebarVisible ? "Coding" : ""} />
            {sidebarVisible &&
              (groupsOpen.coding ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </ListItem>
        <Collapse in={groupsOpen.coding} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {/* Fiji (ImJoy) - ImageJ integration */}
            <ListItem>
              <ListItemButton
                selected={selectedPlugin === "ImJoy"}
                onClick={() => handlePluginChange("ImJoy")}
              >
                <ListItemIcon>
                  <ScienceIcon sx={{ color: SIDEBAR_COLORS.coding }} />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "Fiji" : ""} />
              </ListItemButton>
            </ListItem>

            {/* Blockly - Visual programming */}
            <ListItem>
              <ListItemButton
                selected={selectedPlugin === "Blockly"}
                onClick={() => handlePluginChange("Blockly")}
              >
                <ListItemIcon>
                  <ExtensionIcon sx={{ color: SIDEBAR_COLORS.coding }} />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "Blockly" : ""} />
              </ListItemButton>
            </ListItem>

            {/* Jupyter Notebook - Python scripting */}
            <ListItem>
              <ListItemButton
                selected={selectedPlugin === "JupyteNotebook"}
                onClick={() => handlePluginChange("JupyteNotebook")}
              >
                <ListItemIcon>
                  <SettingsOverscanSharpIcon
                    sx={{ color: SIDEBAR_COLORS.coding }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={sidebarVisible ? "JupyteNotebook" : ""}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Collapse>
        <Divider sx={{ my: 1 }} />

        {/* System Group - Hardware control */}
        <ListItem>
          <ListItemButton onClick={() => toggleGroup("system")}>
            <ListItemIcon>
              <ComputerIcon sx={{ color: SIDEBAR_COLORS.system }} />
            </ListItemIcon>
            <ListItemText primary={sidebarVisible ? "System" : ""} />
            {sidebarVisible &&
              (groupsOpen.system ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </ListItem>
        <Collapse in={groupsOpen.system} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {/* System testing and calibration tools */}
            <ListItem>
              <ListItemButton
                selected={selectedPlugin === "Stresstest"}
                onClick={() => handlePluginChange("Stresstest")}
              >
                <ListItemIcon>
                  <SettingsOverscanSharpIcon
                    sx={{ color: SIDEBAR_COLORS.system }}
                  />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "Stresstest" : ""} />
              </ListItemButton>
            </ListItem>

            <ListItem>
              <ListItemButton
                selected={selectedPlugin === "Objective"}
                onClick={() => handlePluginChange("Objective")}
              >
                <ListItemIcon>
                  <ZoomOutMapIcon sx={{ color: SIDEBAR_COLORS.system }} />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "Objective" : ""} />
              </ListItemButton>
            </ListItem>

            <ListItem>
              <ListItemButton
                selected={selectedPlugin === "FocusLock"}
                onClick={() => handlePluginChange("FocusLock")}
              >
                <ListItemIcon>
                  <Icons.CenterFocusStrong
                    sx={{ color: SIDEBAR_COLORS.system }}
                  />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "Focus Lock" : ""} />
              </ListItemButton>
            </ListItem>

            <ListItem>
              <ListItemButton
                selected={selectedPlugin === "SocketView"}
                onClick={() => handlePluginChange("SocketView")}
              >
                <ListItemIcon>
                  <CommentIcon sx={{ color: SIDEBAR_COLORS.system }} />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "SocketView" : ""} />
              </ListItemButton>
            </ListItem>

            <ListItem>
              <ListItemButton
                selected={selectedPlugin === "StageOffsetCalibration"}
                onClick={() => handlePluginChange("StageOffsetCalibration")}
              >
                <ListItemIcon>
                  <StraightenIcon sx={{ color: SIDEBAR_COLORS.system }} />
                </ListItemIcon>
                <ListItemText
                  primary={sidebarVisible ? "StageOffsetCalibration" : ""}
                />
              </ListItemButton>
            </ListItem>

            <ListItem>
              <ListItemButton
                selected={selectedPlugin === "DetectorTrigger"}
                onClick={() => handlePluginChange("DetectorTrigger")}
              >
                <ListItemIcon>
                  <SensorsIcon sx={{ color: SIDEBAR_COLORS.system }} />
                </ListItemIcon>
                <ListItemText
                  primary={sidebarVisible ? "DetectorTrigger" : ""}
                />
              </ListItemButton>
            </ListItem>

            <ListItem>
              <ListItemButton
                selected={selectedPlugin === "ExtendedLEDMatrix"}
                onClick={() => handlePluginChange("ExtendedLEDMatrix")}
              >
                <ListItemIcon>
                  <BlurOnIcon sx={{ color: SIDEBAR_COLORS.system }} />
                </ListItemIcon>
                <ListItemText
                  primary={sidebarVisible ? "ExtendedLEDMatrix" : ""}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Collapse>
        <Divider sx={{ my: 1 }} />

        {/* Dynamic Plugins from backend */}
        {plugins.map((p) => (
          <ListItem key={p.name}>
            <ListItemButton
              selected={selectedPlugin === p.name}
              onClick={() => handlePluginChange(p.name)}
            >
              <ListItemIcon>
                <BuildIcon />
              </ListItemIcon>
              <ListItemText primary={sidebarVisible ? p.name : ""} />
            </ListItemButton>
          </ListItem>
        ))}

        {/* System Settings Group */}
        <ListItem>
          <ListItemButton onClick={() => toggleGroup("systemSettings")}>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary={sidebarVisible ? "System Settings" : ""} />
            {sidebarVisible &&
              (groupsOpen.systemSettings ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </ListItem>
        <Collapse in={groupsOpen.systemSettings} timeout="auto" unmountOnExit>
          <ListItem>
            <ListItemButton
              selected={selectedPlugin === "WiFi"}
              onClick={() => handlePluginChange("WiFi")}
            >
              <ListItemIcon>
                <WifiSharpIcon />
              </ListItemIcon>
              <ListItemText primary={sidebarVisible ? "WiFi" : ""} />
            </ListItemButton>
          </ListItem>

          <ListItem>
            <ListItemButton
              selected={selectedPlugin === "Connections"}
              onClick={() => handlePluginChange("Connections")}
            >
              <ListItemIcon>
                <LinkIcon />
              </ListItemIcon>
              <ListItemText
                primary={sidebarVisible ? "Connection Settings" : ""}
              />
            </ListItemButton>
          </ListItem>

          <List component="div" disablePadding>
            <ListItem>
              <ListItemButton
                selected={selectedPlugin === "UC2"}
                onClick={() => handlePluginChange("UC2")}
              >
                <ListItemIcon>
                  <MemoryIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "UC2" : ""} />
              </ListItemButton>
            </ListItem>

            <ListItem>
              <ListItemButton
                selected={selectedPlugin === "SystemSettings"}
                onClick={() => handlePluginChange("SystemSettings")}
              >
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "Settings" : ""} />
              </ListItemButton>
            </ListItem>

            <ListItem>
              <ListItemButton
                selected={selectedPlugin === "About"}
                onClick={() => handlePluginChange("About")}
              >
                <ListItemIcon>
                  <InfoIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "About" : ""} />
              </ListItemButton>
            </ListItem>
          </List>
        </Collapse>
      </List>
    </Drawer>
  );
};

export default NavigationDrawer;

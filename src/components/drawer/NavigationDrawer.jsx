import * as Icons from "@mui/icons-material";
import {
  AccessTime as AccessTimeIcon,
  Air as AirIcon,
  Apps as AppsIcon,
  BlurOn as BlurOnIcon,
  Build as BuildIcon,
  Code as CodeIcon,
  Comment as CommentIcon,
  Computer as ComputerIcon,
  Dashboard as DashboardIcon,
  Extension as ExtensionIcon,
  Folder as FolderIcon,
  Info as InfoIcon,
  Link as LinkIcon,
  Memory as MemoryIcon,
  Science as ScienceIcon,
  Sensors as SensorsIcon,
  Settings as SettingsIcon,
  SettingsOverscanSharp as SettingsOverscanSharpIcon,
  SportsEsports as SportsEsportsIcon,
  Straighten as StraightenIcon,
  ThreeDRotation as ThreeDRotationIcon,
  WifiSharp as WifiSharpIcon,
  ZoomOutMap as ZoomOutMapIcon,
} from "@mui/icons-material";
import { Divider, Drawer, List } from "@mui/material";
import { useState } from "react";
import SIDEBAR_COLORS from "../../constants/sidebarColors.js";
import DrawerEntry from "./DrawerEntry.jsx";
import DrawerHeader from "./DrawerHeader.jsx";

/**
 * ImSwitch Navigation Drawer Component
 * Main navigation sidebar for microscopy control interface
 * Follows Copilot Instructions for component extraction and modularity
 * Refactored to use DrawerEntry components for consistency
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
        <DrawerEntry
          icon={<DashboardIcon />}
          label="Live View"
          selected={selectedPlugin === "LiveView"}
          onClick={() => handlePluginChange("LiveView")}
          tooltip="Live View - Main microscopy control"
          color={SIDEBAR_COLORS.liveView}
          collapsed={!sidebarVisible}
        />
        <Divider sx={{ my: 1 }} />

        {/* Apps Group - Microscopy Applications */}
        <DrawerEntry
          icon={<AppsIcon />}
          label="Apps"
          onClick={() => toggleGroup("apps")}
          tooltip="Microscopy Applications"
          color={SIDEBAR_COLORS.apps}
          collapsed={!sidebarVisible}
          collapsible={true}
          expanded={groupsOpen.apps}
        >
          {/* WellPlate - Multi-well microscopy */}
          <DrawerEntry
            avatar={true}
            avatarText="WP"
            label="WellPlate"
            selected={selectedPlugin === "WellPlate"}
            onClick={() => handlePluginChange("WellPlate")}
            tooltip="WellPlate"
            color={SIDEBAR_COLORS.apps}
            collapsed={!sidebarVisible}
            nested={true}
          />

          {/* HistoScan - Automated scanning */}
          <DrawerEntry
            avatar={true}
            avatarText="HS"
            label="HistoScan"
            selected={selectedPlugin === "HistoScan"}
            onClick={() => handlePluginChange("HistoScan")}
            tooltip="HistoScan"
            color={SIDEBAR_COLORS.apps}
            collapsed={!sidebarVisible}
            nested={true}
          />

          {/* STORM Local - Super-resolution microscopy */}
          <DrawerEntry
            avatar={true}
            avatarText="SL"
            label="STORM Local"
            selected={selectedPlugin === "STORMLocal"}
            onClick={() => handlePluginChange("STORMLocal")}
            tooltip="STORM Local"
            color={SIDEBAR_COLORS.apps}
            collapsed={!sidebarVisible}
            nested={true}
          />

          {/* STORM Arkitekt */}
          <DrawerEntry
            avatar={true}
            avatarText="SA"
            label="STORM Arkitekt"
            selected={selectedPlugin === "STORMArkitekt"}
            onClick={() => handlePluginChange("STORMArkitekt")}
            tooltip="STORM Arkitekt"
            color={SIDEBAR_COLORS.apps}
            collapsed={!sidebarVisible}
            nested={true}
          />

          {/* Infinity Scanning */}
          <DrawerEntry
            avatar={true}
            avatarText="IS"
            label="Infinity Scanning"
            selected={selectedPlugin === "Infinity Scanning"}
            onClick={() => handlePluginChange("Infinity Scanning")}
            tooltip="Infinity Scanning"
            color={SIDEBAR_COLORS.apps}
            collapsed={!sidebarVisible}
            nested={true}
          />

          {/* LightSheet - 3D microscopy */}
          <DrawerEntry
            icon={<ThreeDRotationIcon />}
            label="LightSheet"
            selected={selectedPlugin === "LightSheet"}
            onClick={() => handlePluginChange("LightSheet")}
            tooltip="LightSheet - 3D microscopy"
            color={SIDEBAR_COLORS.apps}
            collapsed={!sidebarVisible}
            nested={true}
          />

          {/* Demo Application */}
          <DrawerEntry
            avatar={true}
            avatarText="DM"
            label="Demo"
            selected={selectedPlugin === "Demo"}
            onClick={() => handlePluginChange("Demo")}
            tooltip="Demo"
            color={SIDEBAR_COLORS.apps}
            collapsed={!sidebarVisible}
            nested={true}
          />

          {/* Timelapse - Time-series microscopy */}
          <DrawerEntry
            icon={<AccessTimeIcon />}
            label="Timelapse"
            selected={selectedPlugin === "Timelapse"}
            onClick={() => handlePluginChange("Timelapse")}
            tooltip="Timelapse - Time-series microscopy"
            color={SIDEBAR_COLORS.apps}
            collapsed={!sidebarVisible}
            nested={true}
          />

          {/* FlowStop - Flow control */}
          <DrawerEntry
            icon={<AirIcon />}
            label="FlowStop"
            selected={selectedPlugin === "FlowStop"}
            onClick={() => handlePluginChange("FlowStop")}
            tooltip="FlowStop - Flow control"
            color={SIDEBAR_COLORS.apps}
            collapsed={!sidebarVisible}
            nested={true}
          />

          {/* Lepmon */}
          <DrawerEntry
            avatar={true}
            avatarText="LM"
            label="Lepmon"
            selected={selectedPlugin === "Lepmon"}
            onClick={() => handlePluginChange("Lepmon")}
            tooltip="Lepmon"
            color={SIDEBAR_COLORS.apps}
            collapsed={!sidebarVisible}
            nested={true}
          />

          {/* Maze Game */}
          <DrawerEntry
            icon={<SportsEsportsIcon />}
            label="Maze Game"
            selected={selectedPlugin === "MazeGame"}
            onClick={() => handlePluginChange("MazeGame")}
            tooltip="Maze Game"
            color={SIDEBAR_COLORS.apps}
            collapsed={!sidebarVisible}
            nested={true}
          />
        </DrawerEntry>
        <Divider sx={{ my: 1 }} />

        {/* File Manager - Microscopy data management */}
        <DrawerEntry
          icon={<FolderIcon />}
          label="File Manager"
          selected={selectedPlugin === "FileManager"}
          onClick={() => handlePluginChange("FileManager")}
          tooltip="File Manager - Microscopy data management"
          color={SIDEBAR_COLORS.fileManager}
          collapsed={!sidebarVisible}
        />
        <Divider sx={{ my: 1 }} />

        {/* Coding Group - Programming tools */}
        <DrawerEntry
          icon={<CodeIcon />}
          label="Coding"
          onClick={() => toggleGroup("coding")}
          tooltip="Programming tools"
          color={SIDEBAR_COLORS.coding}
          collapsed={!sidebarVisible}
          collapsible={true}
          expanded={groupsOpen.coding}
        >
          {/* Fiji (ImJoy) - ImageJ integration */}
          <DrawerEntry
            icon={<ScienceIcon />}
            label="Fiji"
            selected={selectedPlugin === "ImJoy"}
            onClick={() => handlePluginChange("ImJoy")}
            tooltip="Fiji - ImageJ integration"
            color={SIDEBAR_COLORS.coding}
            collapsed={!sidebarVisible}
            nested={true}
          />

          {/* Blockly - Visual programming */}
          <DrawerEntry
            icon={<ExtensionIcon />}
            label="Blockly"
            selected={selectedPlugin === "Blockly"}
            onClick={() => handlePluginChange("Blockly")}
            tooltip="Blockly - Visual programming"
            color={SIDEBAR_COLORS.coding}
            collapsed={!sidebarVisible}
            nested={true}
          />

          {/* Jupyter Notebook - Python scripting */}
          <DrawerEntry
            icon={<SettingsOverscanSharpIcon />}
            label="JupyteNotebook"
            selected={selectedPlugin === "JupyteNotebook"}
            onClick={() => handlePluginChange("JupyteNotebook")}
            tooltip="Jupyter Notebook - Python scripting"
            color={SIDEBAR_COLORS.coding}
            collapsed={!sidebarVisible}
            nested={true}
          />
        </DrawerEntry>
        <Divider sx={{ my: 1 }} />

        {/* System Group - Hardware control */}
        <DrawerEntry
          icon={<ComputerIcon />}
          label="System"
          onClick={() => toggleGroup("system")}
          tooltip="Hardware control"
          color={SIDEBAR_COLORS.system}
          collapsed={!sidebarVisible}
          collapsible={true}
          expanded={groupsOpen.system}
        >
          {/* System testing and calibration tools */}
          <DrawerEntry
            icon={<SettingsOverscanSharpIcon />}
            label="Stresstest"
            selected={selectedPlugin === "Stresstest"}
            onClick={() => handlePluginChange("Stresstest")}
            tooltip="Stresstest"
            color={SIDEBAR_COLORS.system}
            collapsed={!sidebarVisible}
            nested={true}
          />

          <DrawerEntry
            icon={<ZoomOutMapIcon />}
            label="Objective"
            selected={selectedPlugin === "Objective"}
            onClick={() => handlePluginChange("Objective")}
            tooltip="Objective control"
            color={SIDEBAR_COLORS.system}
            collapsed={!sidebarVisible}
            nested={true}
          />

          <DrawerEntry
            icon={<Icons.CenterFocusStrong />}
            label="Focus Lock"
            selected={selectedPlugin === "FocusLock"}
            onClick={() => handlePluginChange("FocusLock")}
            tooltip="Focus Lock"
            color={SIDEBAR_COLORS.system}
            collapsed={!sidebarVisible}
            nested={true}
          />

          <DrawerEntry
            icon={<CommentIcon />}
            label="SocketView"
            selected={selectedPlugin === "SocketView"}
            onClick={() => handlePluginChange("SocketView")}
            tooltip="WebSocket communication"
            color={SIDEBAR_COLORS.system}
            collapsed={!sidebarVisible}
            nested={true}
          />

          <DrawerEntry
            icon={<StraightenIcon />}
            label="StageOffsetCalibration"
            selected={selectedPlugin === "StageOffsetCalibration"}
            onClick={() => handlePluginChange("StageOffsetCalibration")}
            tooltip="Stage calibration"
            color={SIDEBAR_COLORS.system}
            collapsed={!sidebarVisible}
            nested={true}
          />

          <DrawerEntry
            icon={<SensorsIcon />}
            label="DetectorTrigger"
            selected={selectedPlugin === "DetectorTrigger"}
            onClick={() => handlePluginChange("DetectorTrigger")}
            tooltip="Detector synchronization"
            color={SIDEBAR_COLORS.system}
            collapsed={!sidebarVisible}
            nested={true}
          />

          <DrawerEntry
            icon={<BlurOnIcon />}
            label="ExtendedLEDMatrix"
            selected={selectedPlugin === "ExtendedLEDMatrix"}
            onClick={() => handlePluginChange("ExtendedLEDMatrix")}
            tooltip="LED illumination control"
            color={SIDEBAR_COLORS.system}
            collapsed={!sidebarVisible}
            nested={true}
          />
        </DrawerEntry>
        <Divider sx={{ my: 1 }} />

        {/* Dynamic Plugins from ImSwitch backend */}
        {plugins.map((p) => (
          <DrawerEntry
            key={p.name}
            icon={<BuildIcon />}
            label={p.name}
            selected={selectedPlugin === p.name}
            onClick={() => handlePluginChange(p.name)}
            tooltip={`Dynamic plugin: ${p.name}`}
            collapsed={!sidebarVisible}
          />
        ))}

        {/* System Settings Group */}
        <DrawerEntry
          icon={<SettingsIcon />}
          label="System Settings"
          onClick={() => toggleGroup("systemSettings")}
          tooltip="System Settings"
          collapsed={!sidebarVisible}
          collapsible={true}
          expanded={groupsOpen.systemSettings}
        >
          <DrawerEntry
            icon={<WifiSharpIcon />}
            label="WiFi"
            selected={selectedPlugin === "WiFi"}
            onClick={() => handlePluginChange("WiFi")}
            tooltip="WiFi configuration"
            collapsed={!sidebarVisible}
            nested={true}
          />

          <DrawerEntry
            icon={<LinkIcon />}
            label="Connection Settings"
            selected={selectedPlugin === "Connections"}
            onClick={() => handlePluginChange("Connections")}
            tooltip="Connection Settings"
            collapsed={!sidebarVisible}
            nested={true}
          />

          <DrawerEntry
            icon={<MemoryIcon />}
            label="UC2"
            selected={selectedPlugin === "UC2"}
            onClick={() => handlePluginChange("UC2")}
            tooltip="UC2 hardware control"
            collapsed={!sidebarVisible}
            nested={true}
          />

          <DrawerEntry
            icon={<SettingsIcon />}
            label="Settings"
            selected={selectedPlugin === "SystemSettings"}
            onClick={() => handlePluginChange("SystemSettings")}
            tooltip="System Settings"
            collapsed={!sidebarVisible}
            nested={true}
          />

          <DrawerEntry
            icon={<InfoIcon />}
            label="About"
            selected={selectedPlugin === "About"}
            onClick={() => handlePluginChange("About")}
            tooltip="About ImSwitch"
            collapsed={!sidebarVisible}
            nested={true}
          />
        </DrawerEntry>
      </List>
    </Drawer>
  );
};

export default NavigationDrawer;

/* global __webpack_init_sharing__, __webpack_share_scopes__ */
import React, { Suspense, useEffect, useState, lazy } from "react";
import LiveView from "./components/LiveView";
import SocketView from "./components/SocketView";
import HistoScanController from "./components/HistoScanController";
import LargeFovScanController from "./components/OpenLayers";
import TimelapseController from "./components/TimelapseController";
import ObjectiveController from "./components/ObjectiveController.js";
import AboutPage from "./components/AboutPage";
import SystemSettings from "./components/SystemSettings";
import Tab_Widgets from "./components/Tab_Widgets";
import LightsheetController from "./components/LightsheetController";
import DemoController from "./components/DemoController.js"
import BlocklyController from "./components/BlocklyController";
import ImJoyView from "./components/ImJoyView";
import JupyterExecutor from "./components/JupyterExecutor";
import { JupyterProvider } from "./context/JupyterContext";
import UC2Controller from "./components/UC2Controller";
import ExtendedLEDMatrixController from "./components/ExtendedLEDMatrixController";
import StageOffsetCalibration from "./components/StageOffsetCalibrationController";
import DetectorTriggerController from "./components/DetectorTriggerController";
import StresstestController from "./components/StresstestController";
import STORMController from "./components/STORMController.js";
import STORMControllerArkitekt from "./components/STORMControllerArkitekt.js";
import STORMControllerLocal from "./components/STORMControllerLocal.js";
import FocusLockController from "./components/FocusLockController.js";
import WiFiController from "./components/WiFiController.js";

import theme from "./theme";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Devices as DevicesIcon,
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
} from "@mui/icons-material";
import * as Icons from "@mui/icons-material";
import WifiSharpIcon from "@mui/icons-material/WifiSharp";
import ThreeDRotationIcon from "@mui/icons-material/ThreeDRotation";
import AirIcon from "@mui/icons-material/Air";
import axios from "axios";
import { WebSocketProvider } from "./context/WebSocketContext";
import { MCTProvider } from "./context/MCTContext";

//axon
import AxonTabComponent from "./axon/AxonTabComponent";
import WebSocketHandler from "./middleware/WebSocketHandler";

//redux
import { useDispatch, useSelector } from "react-redux";
import * as connectionSettingsSlice from "./state/slices/ConnectionSettingsSlice.js";

// Filemanager
import FileManager from "./FileManager/FileManager/FileManager";
import { createFolderAPI } from "./FileManager/api/createFolderAPI";
import { renameAPI } from "./FileManager/api/renameAPI";
import { deleteAPI } from "./FileManager/api/deleteAPI";
import { copyItemAPI, moveItemAPI } from "./FileManager/api/fileTransferAPI";
import { getAllFilesAPI } from "./FileManager/api/getAllFilesAPI";
import { downloadFile } from "./FileManager/api/downloadFileAPI";
import { api } from "./FileManager/api/api";
import "./FileManager/App.scss";
import uc2Logo from "./assets/ouc2_logo_qaudratic.png";

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Container,
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  Avatar, 
  Switch,
  TextField,
  MenuItem,
  Collapse,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CommentIcon from "@mui/icons-material/Comment";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import FlowStopController from "./components/FlowStopController";
import LepMonController from "./components/LepmonController.js";

// Define both light and dark themes

const lightTheme = createTheme({
  palette: {
    mode: "light",
  },
  typography: {
    fontFamily: "Roboto",
    fontWeightBold: 700,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @font-face {
          font-family: 'Roboto';
          font-style: normal;
          font-display: swap;
          font-weight: 400;
          src: local('Roboto'),
               url('/imswitch/fonts/Roboto-Regular.ttf') format('truetype');
        }
        @font-face {
          font-family: 'Roboto';
          font-style: normal;
          font-display: swap;
          font-weight: 700;
          src: local('Roboto Bold'),
               url('/imswitch/fonts/Roboto-Bold.ttf') format('truetype');
        }
      `,
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
  typography: {
    fontFamily: "Roboto",
    fontWeightBold: 700,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        /*root: {
          fontSize: '.8rem', // Beispiel: Schriftgröße der Schaltflächen
          padding: 'px 0px', // Beispiel: Innenabstand der Schaltflächen
        },
        */
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          height: 8, // Beispiel: Höhe des Sliders
        },
        thumb: {
          width: 24, // Beispiel: Breite des Slider-Daumen
          height: 24, // Beispiel: Höhe des Slider-Daumen
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: `
      @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 400;
        src: local('Roboto'),
             url('/imswitch/fonts/Roboto-Regular.ttf') format('truetype');
      }
      @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 700;
        src: local('Roboto Bold'),
             url('/imswitch/fonts/Roboto-Bold.ttf') format('truetype');
      }
      `,
    },
  },
});

function App() {
  /*
    Redux
    */
  // redux dispatcher
  const dispatch = useDispatch();

  // Access global Redux state
  const connectionSettingsState = useSelector(
    connectionSettingsSlice.getConnectionSettingsState
  );

  /*
  States
  */
  // Hook to detect mobile screens
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarVisible, setSidebarVisible] = useState(window.innerWidth > 768); // Sidebar visibility state - hidden by default on mobile
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const newIsMobile = width <= 768;
      setIsMobile(newIsMobile);
      
      // Auto-hide sidebar on mobile by default
      if (newIsMobile && sidebarVisible) {
        setSidebarVisible(false);
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Set initial state
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarVisible]);
  
  const drawerWidth = sidebarVisible ? (isMobile ? '100%' : 240) : (isMobile ? 0 : 60); // Full width when open, responsive sizing

  // hostIP now always includes protocol (http:// or https://)
  const [hostIP, setHostIP] = useState(
    connectionSettingsState.ip.startsWith("http")
      ? connectionSettingsState.ip
      : `https://${connectionSettingsState.ip}`
  );
  const [hostProtocol, setHostProtocol] = useState(
    connectionSettingsState.ip.startsWith("http://") ? "http://" : "https://"
  );
  const [websocketPort, setWebsocketPort] = useState(
    connectionSettingsState.websocketPort
  );
  const [apiPort, setApiPort] = useState(connectionSettingsState.apiPort);

  const [selectedPlugin, setSelectedPlugin] = useState("LiveView"); // Control which plugin to show
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // State to toggle between light and dark themes
  const [sharedImage, setSharedImage] = useState(null);
  const [fileManagerInitialPath, setFileManagerInitialPath] = useState("/");
  const [layout, setLayout] = useState([
    { i: "widget1", x: 0, y: 0, w: 2, h: 2 },
    { i: "widget2", x: 2, y: 0, w: 2, h: 2 },
    { i: "widget3", x: 4, y: 0, w: 2, h: 2 },
    { i: "Lightsheet", x: 0, y: 2, w: 5, h: 5 },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState([]);

  // State for collapsible groups
  const [groupsOpen, setGroupsOpen] = useState(() => {
    // English comment: restore from localStorage if available, otherwise start collapsed on first load
    try {
      const saved = localStorage.getItem("imswitch.groupsOpen");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // English comment: ignore JSON/localStorage errors
    }
    return {
      apps: false,
      coding: false,
      system: false,
      systemSettings: false,
    };
  });

  /*
  FileManager
  */
  // Update fileUploadConfig to use hostIP (with protocol)
  const fileUploadConfig = {
    url: `${hostIP}:${apiPort}/upload`,
  };

  // Fetch Files
  const getFiles = async () => {
    setIsLoading(true);
    const response = await getAllFilesAPI();
    setFiles(response.data);
    setIsLoading(false);
  };

  const handleCreateFolder = async (name, parentFolder) => {
    setIsLoading(true);
    const response = await createFolderAPI(name, parentFolder?._id);
    if (response.status === 200 || response.status === 201) {
      setFiles((prev) => [...prev, response.data]);
    }
    setIsLoading(false);
  };

  const handleFileUploading = (file, parentFolder) => ({
    parentId: parentFolder?._id,
  });

  const handleFileUploaded = (response) => {
    const uploadedFile = JSON.parse(response);
    setFiles((prev) => [...prev, uploadedFile]);
  };

  const handleRename = async (file, newName) => {
    setIsLoading(true);
    await renameAPI(file._id, newName);
    getFiles();
    setIsLoading(false);
  };

  const handleDelete = async (files) => {
    setIsLoading(true);
    const idsToDelete = files.map((file) => file._id);
    await deleteAPI(idsToDelete);
    getFiles();
    setIsLoading(false);
  };

  const handlePaste = async (copiedItems, destinationFolder, operationType) => {
    setIsLoading(true);
    const copiedItemIds = copiedItems.map((item) => item._id);
    if (operationType === "copy") {
      await copyItemAPI(copiedItemIds, destinationFolder?._id);
    } else {
      await moveItemAPI(copiedItemIds, destinationFolder?._id);
    }
    getFiles();
  };

  const handleDownload = async (files) => {
    await downloadFile(files, hostIP, apiPort);
  };

  const handleRefresh = () => getFiles();

  const handleOpenWithImJoy = (file) => {
    const fileUrl = `${hostIP}:${apiPort}/FileManager/download/${file.path}`;
    setSharedImage({
      url: fileUrl,
      name: file.name,
    });
    // Switch to ImJoy tab
    setSelectedPlugin("ImJoy");
  };

  /*
  On Value Changes
  */

  useEffect(() => {
    const currentHostname = window.location.hostname;
    const portsToCheck = [8001, 8002, 443];

    // Try both http and https for each port, and use the first working combination
    const findValidPort = async () => {
      try {
        let found = false;
        for (const protocol of ["https://", "http://"]) {
          for (const port of portsToCheck) {
            try {
              const url = `${protocol}${currentHostname}:${port}/plugins`;
              const response = await fetch(url, { method: "HEAD" });
              if (response.ok) {
                setHostIP(`${protocol}${currentHostname}`);
                setHostProtocol(protocol);
                setApiPort(port);
                found = true;
                break;
              }
            } catch (err) {
              // Ignore fetch errors and try next combination
            }
          }
          if (found) break;
        }
        if (!found) {
          throw new Error("No valid API port found.");
        }
      } catch (error) {
        console.error("No valid API port found.");
      }
    };

    if (!currentHostname.startsWith("youseetoo.github.io")) {
      findValidPort();
    }
  }, []);

  const checkPortsForApi = async (hostname, ports) => {
    for (const port of ports) {
      try {
        const url = `https://${hostname}:${port}/openapi.json`;
        const response = await axios.get(url, { timeout: 3000 });
        if (response.status === 200) {
          return port;
        }
      } catch (error) {
        console.error(`Failed to retrieve API from ${hostname}:${port}`);
      }
    }
    throw new Error("No valid port found for API.");
  };

  // change API url/port and update filelist
  useEffect(() => {
    const apiUrl = `${hostIP}:${apiPort}/plugins`;
    api.defaults.baseURL = `${hostIP}:${apiPort}/FileManager`;
    handleRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostIP, apiPort]);

  // Dialog handlers for the URL / Port settings
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Open the dialog
  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  // Handle changes to the IP address (host only, no protocol)
  const handlehostIPChange = (event) => {
    let ip = event.target.value.trim();
    // Remove protocol if user enters it
    ip = ip.replace(/^https?:\/\//, "");
    setHostIP(`${hostProtocol}${ip}`);
  };

  // Handle changes to the IP address
  const handlehostWebsocketPortChange = (event) => {
    let port = event.target.value.trim();
    setWebsocketPort(port);
  };
  // Handle changes to the IP address
  const handlehostApiPortChange = (event) => {
    let port = event.target.value.trim();
    setApiPort(port);
  };

  // handle default filemanager path change
  const handleFileManagerInitialPathChange = (event) => {
    // English comment: store the desired path
    const path = event;
    setFileManagerInitialPath(path);
    setSelectedPlugin("FileManager");
    // Refresh immediately since FileNavigationProvider now handles path changes properly
    handleRefresh();
  };

  // Save the IP address and port, and allow protocol selection
  const handleSavehostIP = () => {
    // hostIP is always protocol + ip
    setHostIP(`${hostProtocol}${hostIP.replace(/^https?:\/\//, "")}`);
    setApiPort(apiPort);
    setWebsocketPort(websocketPort);
    setHostProtocol(hostProtocol);
    handleCloseDialog();

    //redux
    dispatch(connectionSettingsSlice.setIp(`${hostProtocol}${hostIP.replace(/^https?:\/\//, "")}`));
    dispatch(connectionSettingsSlice.setWebsocketPort(websocketPort));
    dispatch(connectionSettingsSlice.setApiPort(apiPort));
  };

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  const handlePluginChange = (plugin) => {
    setSelectedPlugin(plugin);
  };

  const toggleGroup = (groupName) => {
    setGroupsOpen(prev => {
      const next = {
        ...prev,
        [groupName]: !prev[groupName],
      };
      // English comment: persist the open/closed state
      try {
        localStorage.setItem("imswitch.groupsOpen", JSON.stringify(next));
      } catch (e) {
        // ignore storage errors
      }
      return next;
    });
  };

  /*
  PLUGIN LOADING from ImSwitch
  */
  function loadRemote({ remote, scope, exposed }) {
    const url = `${hostIP}:${apiPort}${remote}`;

    return new Promise((resolve, reject) => {
      if (!document.querySelector(`script[data-mf="${scope}"]`)) {
        const el = document.createElement("script");
        el.src = url;
        el.dataset.mf = scope;
        el.onload = init;
        el.onerror = reject;
        document.head.appendChild(el);
      } else {
        init();
      }

      async function init() {
        try {
          await __webpack_init_sharing__("default");

          // Check if the scope is loaded
          if (!window[scope]) {
            console.error(
              `Scope '${scope}' not found on window. Make sure the script is loaded correctly.`
            );
            return;
          }
          const container = window[scope];
          await container.init(__webpack_share_scopes__.default);

          const factory = await container.get(
            exposed.startsWith("./") ? exposed : `./${exposed}`
          );
          const module = factory();
          resolve({ default: module.default || module }); // <-- important
        } catch (e) {
          reject(e);
        }
      }
    });
  }

  function usePluginWidgets() {
    const [widgets, setWidgets] = useState([]);

    useEffect(() => {
      const fetchPlugins = async () => {
        try {
          // Construct the API URL dynamically using hostIP and apiPort
          const apiUrl = `${hostIP}:${apiPort}/plugins`;

          // Fetch the plugin data
          const response = await fetch(apiUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch plugins: ${response.statusText}`);
          }

          // Access the plugins array from the data object
          const data = await response.json();
          const plugins = data.plugins;

          // Map the plugin data to widgets
          const widgetsData = await Promise.all(
            plugins.map(async (m) => ({
              name: m.name,
              Component: lazy(() => loadRemote(m)), // Wrap loadRemote with lazy
            }))
          );

          // Update the widgets state
          setWidgets(widgetsData);
        } catch (error) {
          console.error("Error loading plugins:", error);
        }
      };

      fetchPlugins();
    }, [hostIP, apiPort]); // Re-run if hostIP or apiPort changes

    return widgets;
  }
  const plugins = usePluginWidgets();

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <WebSocketHandler />
      {/* headless */}
      <WebSocketProvider hostIP={hostIP}>
        <CssBaseline />
        <Box sx={{ display: "flex" }}>
          <AppBar
            position="fixed"
            sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
          >
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={() => setSidebarVisible(!sidebarVisible)}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" sx={{ 
                flexGrow: 1, 
                fontWeight: "bold",
                fontSize: isMobile ? "1rem" : "1.25rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {isMobile ? selectedPlugin : `ImSwitch - ${selectedPlugin}`}
              </Typography>
              {!isMobile && (
                <Typography variant="h6" sx={{ fontWeight: "bold", marginRight: 1 }}>
                  Light/dark
                </Typography>
              )}
              <Switch
                checked={isDarkMode}
                onChange={toggleTheme}
                color="default"
                inputProps={{ "aria-label": "toggle theme" }}
                sx={{
                  "& .MuiSwitch-thumb": {
                    width: isMobile ? 24 : 20,
                    height: isMobile ? 24 : 20,
                  },
                  "& .MuiSwitch-track": {
                    minWidth: isMobile ? 48 : 34,
                    height: isMobile ? 28 : 14,
                  }
                }}
              />
              <Avatar src={uc2Logo} />
            </Toolbar>
          </AppBar>

          {/* Sidebar Drawer with responsive behavior */}
          <Drawer
            variant={isMobile ? "temporary" : "permanent"}
            open={sidebarVisible}
            onClose={() => setSidebarVisible(false)}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              "& .MuiDrawer-paper": {
                width: drawerWidth,
                boxSizing: "border-box",
                top: isMobile ? 0 : 64, // Full height on mobile
                height: isMobile ? "100%" : "calc(100% - 64px)",
                zIndex: isMobile ? 1300 : 1200,
                transition: theme => theme.transitions.create('width', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
              },
            }}
          >
            {/* Sidebar content */}
            <List>
              {/* LiveView */}
              <ListItem
                button
                selected={selectedPlugin === "LiveView"}
                onClick={() => handlePluginChange("LiveView")}
              >
                <ListItemIcon>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "Live View" : ""} />
              </ListItem>

              {/* Apps Group */}
              <ListItem button onClick={() => toggleGroup('apps')}>
                <ListItemIcon>
                  <AppsIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "Apps" : ""} />
                {sidebarVisible && (groupsOpen.apps ? <ExpandLess /> : <ExpandMore />)}
              </ListItem>
              <Collapse in={groupsOpen.apps} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {/* WellPlate */}
                  <ListItem
                    button
                    selected={selectedPlugin === "WellPlate"}
                    onClick={() => handlePluginChange("WellPlate")}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <SettingsOverscanSharpIcon />
                    </ListItemIcon>
                    <ListItemText primary={sidebarVisible ? "WellPlate" : ""} />
                  </ListItem>

                  {/* HistoScan */}
                  <ListItem
                    button
                    selected={selectedPlugin === "HistoScan"}
                    onClick={() => handlePluginChange("HistoScan")}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <SettingsOverscanSharpIcon />
                    </ListItemIcon>
                    <ListItemText primary={sidebarVisible ? "HistoScan" : ""} />
                  </ListItem>

                  {/* STORM Local */}
                  <ListItem
                    button
                    selected={selectedPlugin === "STORMLocal"}
                    onClick={() => handlePluginChange("STORMLocal")}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>  
                      <SettingsOverscanSharpIcon />
                    </ListItemIcon>
                    <ListItemText primary={sidebarVisible ? "STORM Local" : ""} />
                  </ListItem>

                  {/* STORM Arkitekt */}
                  <ListItem
                    button
                    selected={selectedPlugin === "STORMArkitekt"}
                    onClick={() => handlePluginChange("STORMArkitekt")}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>  
                      <SettingsOverscanSharpIcon />
                    </ListItemIcon>
                    <ListItemText primary={sidebarVisible ? "STORM Arkitekt" : ""} />
                  </ListItem>

                  {/* Infinity Scanning */}
                  <ListItem
                    button
                    selected={selectedPlugin === "Infinity Scanning"}
                    onClick={() => handlePluginChange("Infinity Scanning")}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <SettingsOverscanSharpIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={sidebarVisible ? "Infinity Scanning" : ""}
                    />
                  </ListItem>

                  {/* Lightsheet */}
                  <ListItem
                    button
                    selected={selectedPlugin === "LightSheet"}
                    onClick={() => handlePluginChange("LightSheet")}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <ThreeDRotationIcon />
                    </ListItemIcon>
                    <ListItemText primary={sidebarVisible ? "LightSheet" : ""} />
                  </ListItem>

                  {/* Demo */}
                  <ListItem
                    button
                    selected={selectedPlugin === "Demo"}
                    onClick={() => handlePluginChange("Demo")}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <SettingsOverscanSharpIcon />
                    </ListItemIcon>
                    <ListItemText primary={sidebarVisible ? "Demo" : ""} />
                  </ListItem>

                  {/* Timelapse */}
                  <ListItem
                    button
                    selected={selectedPlugin === "Timelapse"}
                    onClick={() => handlePluginChange("Timelapse")}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <AccessTimeIcon />
                    </ListItemIcon>
                    <ListItemText primary={sidebarVisible ? "Timelapse" : ""} />
                  </ListItem>

                  {/* FlowStop */}
                  <ListItem
                    button
                    selected={selectedPlugin === "FlowStop"}
                    onClick={() => handlePluginChange("FlowStop")}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <AirIcon />
                    </ListItemIcon>
                    <ListItemText primary={sidebarVisible ? "FlowStop" : ""} />
                  </ListItem>

                  {/* Lepmon */}
                  <ListItem
                    button
                    selected={selectedPlugin === "Lepmon"}
                    onClick={() => handlePluginChange("Lepmon")}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <AirIcon />
                    </ListItemIcon>
                    <ListItemText primary={sidebarVisible ? "Lepmon" : ""} />
                  </ListItem>
                </List>
              </Collapse>

              {/* File Manager */}
              <ListItem
                button
                selected={selectedPlugin === "FileManager"}
                onClick={() => handlePluginChange("FileManager")}
              >
                <ListItemIcon>
                  <FolderIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "File Manager" : ""} />
              </ListItem>

              {/* Coding Group */}
              <ListItem button onClick={() => toggleGroup('coding')}>
                <ListItemIcon>
                  <CodeIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "Coding" : ""} />
                {sidebarVisible && (groupsOpen.coding ? <ExpandLess /> : <ExpandMore />)}
              </ListItem>
              <Collapse in={groupsOpen.coding} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {/* Fiji (ImJoy) */}
                  <ListItem
                    button
                    selected={selectedPlugin === "ImJoy"}
                    onClick={() => handlePluginChange("ImJoy")}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <BuildIcon />
                    </ListItemIcon>
                    <ListItemText primary={sidebarVisible ? "Fiji" : ""} />
                  </ListItem>

                  {/* Blockly */}
                  <ListItem
                    button
                    selected={selectedPlugin === "Blockly"}
                    onClick={() => handlePluginChange("Blockly")}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <SettingsIcon />
                    </ListItemIcon>
                    <ListItemText primary={sidebarVisible ? "Blockly" : ""} />
                  </ListItem>

                  {/* JupyteNotebook */}
                  <ListItem
                    button
                    selected={selectedPlugin === "JupyteNotebook"}
                    onClick={() => handlePluginChange("JupyteNotebook")}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <SettingsOverscanSharpIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={sidebarVisible ? "JupyteNotebook" : ""}
                    />
                  </ListItem>
                </List>
              </Collapse>

              {/* System Group */}
              <ListItem button onClick={() => toggleGroup('system')}>
                <ListItemIcon>
                  <ComputerIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "System" : ""} />
                {sidebarVisible && (groupsOpen.system ? <ExpandLess /> : <ExpandMore />)}
              </ListItem>
              <Collapse in={groupsOpen.system} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {/* Stresstest */}
                  <ListItem
                    button
                    selected={selectedPlugin === "Stresstest"}
                    onClick={() => handlePluginChange("Stresstest")}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <SettingsOverscanSharpIcon />
                    </ListItemIcon>
                    <ListItemText primary={sidebarVisible ? "Stresstest" : ""} />
                  </ListItem>

                  {/* Objective */}
                  <ListItem
                    button
                    selected={selectedPlugin === "Objective"}
                    onClick={() => handlePluginChange("Objective")}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <ZoomOutMapIcon />
                    </ListItemIcon>
                    <ListItemText primary={sidebarVisible ? "Objective" : ""} />
                  </ListItem>

                  {/* Focus Lock */}
                  <ListItem
                    button
                    selected={selectedPlugin === "FocusLock"}
                    onClick={() => handlePluginChange("FocusLock")}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <Icons.CenterFocusStrong />
                    </ListItemIcon>
                    <ListItemText primary={sidebarVisible ? "Focus Lock" : ""} />
                  </ListItem>

                  {/* SocketView */}
                  <ListItem
                    button
                    selected={selectedPlugin === "SocketView"}
                    onClick={() => handlePluginChange("SocketView")}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <CommentIcon />
                    </ListItemIcon>
                    <ListItemText primary={sidebarVisible ? "SocketView" : ""} />
                  </ListItem>

                  {/* WiFi */}
                  <ListItem
                    button
                    selected={selectedPlugin === "WiFi"}
                    onClick={() => handlePluginChange("WiFi")}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <WifiSharpIcon />
                    </ListItemIcon>
                    <ListItemText primary={sidebarVisible ? "WiFi" : ""} />
                  </ListItem>

                  {/* Connections */}
                  <ListItem
                    button
                    selected={selectedPlugin === "Connectoins"}
                    onClick={handleOpenDialog}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <WifiSharpIcon />
                    </ListItemIcon>
                    <ListItemText primary={sidebarVisible ? "Connection Settings" : ""} />
                  </ListItem>

                  {/* StageOffsetCalibration */}
                  <ListItem
                    button
                    selected={selectedPlugin === "StageOffsetCalibration"}
                    onClick={() => handlePluginChange("StageOffsetCalibration")}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <AirIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={sidebarVisible ? "StageOffsetCalibration" : ""}
                    />
                  </ListItem>

                  {/* DetectorTrigger */}
                  <ListItem
                    button
                    selected={selectedPlugin === "DetectorTrigger"}
                    onClick={() => handlePluginChange("DetectorTrigger")}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <AirIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={sidebarVisible ? "DetectorTrigger" : ""}
                    />
                  </ListItem>

                  {/* ExtendedLEDMatrix */}
                  <ListItem
                    button
                    selected={selectedPlugin === "ExtendedLEDMatrix"}
                    onClick={() => handlePluginChange("ExtendedLEDMatrix")}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <AirIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={sidebarVisible ? "ExtendedLEDMatrix" : ""}
                    />
                  </ListItem>
                </List>
              </Collapse>

              {/* System Settings Group */}
              <ListItem button onClick={() => toggleGroup('systemSettings')}>
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "System Settings" : ""} />
                {sidebarVisible && (groupsOpen.systemSettings ? <ExpandLess /> : <ExpandMore />)}
              </ListItem>
              <Collapse in={groupsOpen.systemSettings} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {/* UC2 */}
                  <ListItem
                    button
                    selected={selectedPlugin === "UC2"}
                    onClick={() => handlePluginChange("UC2")}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <AirIcon />
                    </ListItemIcon>
                    <ListItemText primary={sidebarVisible ? "UC2" : ""} />
                  </ListItem>

                  {/* Settings */}
                  <ListItem
                    button
                    selected={selectedPlugin === "SystemSettings"}
                    onClick={() => handlePluginChange("SystemSettings")}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <SettingsIcon />
                    </ListItemIcon>
                    <ListItemText primary={sidebarVisible ? "Settings" : ""} />
                  </ListItem>

                  {/* About */}
                  <ListItem
                    button
                    selected={selectedPlugin === "About"}
                    onClick={() => handlePluginChange("About")}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <InfoIcon />
                    </ListItemIcon>
                    <ListItemText primary={sidebarVisible ? "About" : ""} />
                  </ListItem>
                </List>
              </Collapse>

              {/* Widgets */}
              <ListItem button onClick={() => handlePluginChange("Widgets")}>
                <ListItemIcon>
                  <DevicesIcon />
                </ListItemIcon>
                <ListItemText
                  selected={selectedPlugin === "Widgets"}
                  primary={sidebarVisible ? "Widgets" : ""}
                />
              </ListItem>

              {/* Plugins */}
              {plugins.map((p) => (
                <ListItem
                  button
                  onClick={() => setSelectedPlugin(p.name)}
                  key={p.name}
                >
                  <ListItemIcon>{React.createElement(BuildIcon)}</ListItemIcon>
                  <ListItemText primary={sidebarVisible ? p.name : ""} />
                </ListItem>
              ))}

              {/* Add a minimize/maximize button */}
              <ListItem
                button
                onClick={() => setSidebarVisible(!sidebarVisible)}
              >
                <ListItemIcon>
                  <MenuIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "Minimize" : ""} />
              </ListItem>
            </List>
          </Drawer>

          {/* Main content area */}
          <Box
            component="main"
            sx={{ 
              flexGrow: 1, 
              p: isMobile ? 1 : 3, 
              marginTop: "64px",
              marginLeft: !isMobile && sidebarVisible ? 0 : 0,
              transition: theme => theme.transitions.create(['margin', 'padding'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
              minHeight: "calc(100vh - 64px)",
              overflow: "auto",
            }}
          >
            {selectedPlugin === "WellPlate" && <AxonTabComponent />}
            <Box
              sx={{ display: selectedPlugin === "LiveView" ? "block" : "none" }}
            >
              <LiveView
                hostIP={hostIP}
                hostPort={apiPort}
                drawerWidth={drawerWidth}
                // pass down a setter or context for the image if needed
                onImageUpdate={(img) => setSharedImage(img)}
                setSelectedPlugin={setSelectedPlugin}
                setFileManagerInitialPath={handleFileManagerInitialPathChange} // pass function
              />
            </Box>
            <Box
              sx={{ display: selectedPlugin === "ImJoy" ? "block" : "none" }}
            >
              <ImJoyView
                hostIP={hostIP}
                hostPort={apiPort}
                sharedImage={sharedImage}
              />
            </Box>
            {selectedPlugin === "HistoScan" && (
              <HistoScanController hostIP={hostIP} hostPort={apiPort} />
            )}
            {selectedPlugin === "STORMLocal" && (
                <STORMControllerLocal hostIP={hostIP} hostPort={apiPort} />
            )}
            {selectedPlugin === "STORMArkitekt" && (
                <STORMControllerArkitekt hostIP={hostIP} hostPort={apiPort} />
            )}
            {selectedPlugin === "Stresstest" && (
              <StresstestController hostIP={hostIP} hostPort={apiPort} />
            )}
            {selectedPlugin === "FocusLock" && (
              <FocusLockController hostIP={hostIP} hostPort={apiPort} />
            )}
            {selectedPlugin === "JupyteNotebook" && (
              <JupyterProvider>
                <JupyterExecutor hostIP={hostIP} hostPort={apiPort} />
              </JupyterProvider>
            )}
            {selectedPlugin === "Infinity Scanning" && (
              <LargeFovScanController hostIP={hostIP} hostPort={apiPort} />
            )}
            {selectedPlugin === "Blockly" && <BlocklyController />}
            {selectedPlugin === "Timelapse" && (
              <MCTProvider>
                <TimelapseController
                  hostIP={hostIP}
                  hostPort={apiPort}
                  title="Timelapse"
                />
              </MCTProvider>
            )}
            {selectedPlugin === "Objective" && (
              <ObjectiveController hostIP={hostIP} hostPort={apiPort} />
            )}
            {selectedPlugin === "About" && <AboutPage />}
            {selectedPlugin === "SystemSettings" && (
              <SystemSettings hostIP={hostIP} hostPort={apiPort} />
            )}
            {selectedPlugin === "FileManager" && (
              <div className="app">
                <div className="file-manager-container">
                  <FileManager
                    baseUrl={`${hostIP}:${apiPort}`}
                    files={files}
                    fileUploadConfig={fileUploadConfig}
                    isLoading={isLoading}
                    onCreateFolder={handleCreateFolder}
                    onFileUploading={handleFileUploading}
                    onFileUploaded={handleFileUploaded}
                    onPaste={handlePaste}
                    onRename={handleRename}
                    onDownload={handleDownload}
                    onFileOpen={handleOpenWithImJoy}
                    onDelete={handleDelete}
                    onRefresh={handleRefresh}
                    layout="grid"
                    enableFilePreview
                    maxFileSize={10485760}
                    filePreviewPath={`${hostIP}:${apiPort}/`}
                    acceptedFileTypes=".txt, .png, .jpg, .jpeg, .pdf, .doc, .docx, .exe, .js, .csv"
                    initialPath={fileManagerInitialPath} // TODO: THIS IS REALLY HACKY!
                  />
                </div>
              </div>
            )}
            {selectedPlugin === "LightSheet" && (
              <LightsheetController hostIP={hostIP} hostPort={apiPort} />
            )}
            {selectedPlugin === "Demo" && (
              <DemoController hostIP={hostIP} hostPort={apiPort} />
            )}
            {selectedPlugin === "WiFi" && (
              <WiFiController hostIP={hostIP} hostPort={apiPort} />
            )}
            {plugins.map(
              (p) =>
                selectedPlugin === p.name && (
                  <Suspense fallback={<div>loading…</div>} key={p.name}>
                    <p.Component hostIP={hostIP} hostPort={apiPort} />
                  </Suspense>
                )
            )}
            {selectedPlugin === "FlowStop" && (
              <FlowStopController hostIP={hostIP} hostPort={apiPort} />
            )}
            {selectedPlugin === "StageOffsetCalibration" && (
              <StageOffsetCalibration hostIP={hostIP} hostPort={apiPort} />
            )}
            {selectedPlugin === "UC2" && (
              <UC2Controller hostIP={hostIP} hostPort={apiPort} />
            )}
            {selectedPlugin === "DetectorTrigger" && (
              <DetectorTriggerController hostIP={hostIP} hostPort={apiPort} />
            )}
            {selectedPlugin === "ExtendedLEDMatrix" && (
              <ExtendedLEDMatrixController
                hostIP={hostIP}
                hostPort={apiPort}
                layout={layout}
                onLayoutChange={(newLayout) => setLayout(newLayout)}
              />
            )}
            {selectedPlugin === "Lepmon" && (
              <LepMonController hostIP={hostIP} hostPort={apiPort} />
            )}
            {selectedPlugin === "SocketView" && (
              <SocketView hostIP={hostIP} hostPort={websocketPort} />
            )}
            {selectedPlugin === "Widgets" && (
              <Tab_Widgets
                hostIP={hostIP}
                hostPort={apiPort}
                layout={layout}
                onLayoutChange={(newLayout) => setLayout(newLayout)}
              />
            )}
          </Box>

          {/* IP Address Dialog */}
          <Dialog open={isDialogOpen} onClose={handleCloseDialog}>
            <DialogTitle>Enter IP Address</DialogTitle>
            <DialogContent>
              <TextField
                select
                margin="dense"
                id="protocol"
                label="Protocol"
                value={hostProtocol}
                onChange={e => {
                  setHostProtocol(e.target.value);
                  setHostIP(`${e.target.value}${hostIP.replace(/^https?:\/\//, "")}`);
                }}
                fullWidth
              >
                <MenuItem value="https://">https://</MenuItem>
                <MenuItem value="http://">http://</MenuItem>
              </TextField>
              <TextField
                autoFocus
                margin="dense"
                id="ip-address"
                label="IP Address"
                type="text"
                fullWidth
                value={hostIP.replace(/^https?:\/\//, "")}
                onChange={handlehostIPChange}
              />
              <TextField
                margin="dense"
                id="port websocket"
                label="Port (websocket)"
                type="text"
                fullWidth
                value={websocketPort}
                onChange={handlehostWebsocketPortChange}
              />
              <TextField
                margin="dense"
                id="port api"
                label="Port (API)"
                type="text"
                fullWidth
                value={apiPort}
                onChange={handlehostApiPortChange}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={handleSavehostIP}>Save</Button>
            </DialogActions>
          </Dialog>
        </Box>
      </WebSocketProvider>
    </ThemeProvider>
  );
}

export default App;

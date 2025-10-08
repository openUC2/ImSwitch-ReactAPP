import BlurOnIcon from "@mui/icons-material/BlurOn";
import SensorsIcon from "@mui/icons-material/Sensors";
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
import LightsheetController from "./components/LightsheetController";
import DemoController from "./components/DemoController.js";
import BlocklyController from "./components/BlocklyController";
import ImJoyView from "./components/ImJoyView";
import JupyterExecutor from "./components/JupyterExecutor";
import { JupyterProvider } from "./context/JupyterContext";
import UC2Controller from "./components/UC2Controller";
import ExtendedLEDMatrixController from "./components/ExtendedLEDMatrixController";
import StageOffsetCalibration from "./components/StageOffsetCalibrationController";
import DetectorTriggerController from "./components/DetectorTriggerController";
import StresstestController from "./components/StresstestController";
import STORMControllerArkitekt from "./components/STORMControllerArkitekt.js";
import STORMControllerLocal from "./components/STORMControllerLocal.js";
import FocusLockController from "./components/FocusLockController.js";
import WiFiController from "./components/WiFiController.js";
import ConnectionSettings from "./components/ConnectionSettings";
import { setIp, setApiPort } from "./state/slices/ConnectionSettingsSlice";
import SIDEBAR_COLORS from "./constants/sidebarColors";
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
  Extension as ExtensionIcon,
  Science as ScienceIcon,
  WifiSharp as WifiSharpIcon,
  ThreeDRotation as ThreeDRotationIcon,
} from "@mui/icons-material";
import * as Icons from "@mui/icons-material";
import AirIcon from "@mui/icons-material/Air";
import StraightenIcon from "@mui/icons-material/Straighten";
import MemoryIcon from "@mui/icons-material/Memory";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import axios from "axios";
import { WebSocketProvider } from "./context/WebSocketContext";
import { MCTProvider } from "./context/MCTContext";

//axon
import AxonTabComponent from "./axon/AxonTabComponent";
import WebSocketHandler from "./middleware/WebSocketHandler";

//redux
import { useDispatch, useSelector } from "react-redux";
import * as connectionSettingsSlice from "./state/slices/ConnectionSettingsSlice.js";
import { getThemeState } from "./state/slices/ThemeSlice";
import StatusMessage from "./components/StatusMessage";
import {
  getNotificationState,
  clearNotification,
} from "./state/slices/NotificationSlice";

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

import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  Collapse,
  Tooltip,
  Avatar,
  Divider,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
  Link as LinkIcon,
  Comment as CommentIcon,
  ZoomOutMap as ZoomOutMapIcon,
} from "@mui/icons-material";
import FlowStopController from "./components/FlowStopController";
import LepMonController from "./components/LepmonController.js";
import MazeGameController from "./components/MazeGameController.js";
import TopBar from "./components/TopBar";
import DrawerHeader from "./components/DrawerHeader";

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
  // Notification state
  const notification = useSelector(getNotificationState);

  /*
    Redux
    */
  // redux dispatcher
  const dispatch = useDispatch();

  // Access global Redux state
  const connectionSettingsState = useSelector(
    connectionSettingsSlice.getConnectionSettingsState
  );
  const { isDarkMode } = useSelector(getThemeState);

  /*
  States
  */
  // Hook to detect mobile screens
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarVisible, setSidebarVisible] = useState(window.innerWidth > 768); // Sidebar visibility state - hidden by default on mobile

  // Track previous isMobile to detect transitions
  const [prevIsMobile, setPrevIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const newIsMobile = width <= 768;
      setIsMobile(newIsMobile);

      // Only close sidebar if switching from desktop to mobile
      if (!prevIsMobile && newIsMobile) {
        setSidebarVisible(false);
      }
      setPrevIsMobile(newIsMobile);
    };

    window.addEventListener("resize", handleResize);
    // Set initial state
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [prevIsMobile]);

  const drawerWidth = sidebarVisible
    ? isMobile
      ? "100%"
      : 240
    : isMobile
    ? 0
    : 90; // Collapsed sidebar width on desktop

  const hostIP = connectionSettingsState.ip;
  const websocketPort = connectionSettingsState.websocketPort;
  const apiPort = connectionSettingsState.apiPort;

  const [selectedPlugin, setSelectedPlugin] = useState("LiveView"); // Control which plugin to show
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

  // On Value Changes
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
                dispatch(setIp(`${protocol}${currentHostname}`));
                dispatch(setApiPort(port));
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
  }, [dispatch]);

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
    api.defaults.baseURL = `${hostIP}:${apiPort}/FileManager`;
    handleRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostIP, apiPort]);

  // handle default filemanager path change
  const handleFileManagerInitialPathChange = (event) => {
    // English comment: store the desired path
    const path = event;
    setFileManagerInitialPath(path);
    setSelectedPlugin("FileManager");
    // Refresh immediately since FileNavigationProvider now handles path changes properly
    handleRefresh();
  };

  // Helper: handle menu click, close drawer on mobile
  const handlePluginChange = (plugin) => {
    setSelectedPlugin(plugin);
    if (isMobile) setSidebarVisible(false);
  };

  const toggleGroup = (groupName) => {
    setGroupsOpen((prev) => {
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
        {/* Global Status/Notification Message */}
        <StatusMessage
          message={notification.message}
          type={notification.type}
          onClose={() => dispatch(clearNotification())}
        />
        <Box sx={{ display: "flex" }}>
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
            {/* Sidebar content */}
            <List>
              {/* LiveView */}
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

              {/* Apps Group */}
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
                  {/* WellPlate */}
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
                          justifyContent: sidebarVisible
                            ? "flex-start"
                            : "center",
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
                          <ListItemText
                            primary="WellPlate"
                            sx={{ opacity: 1 }}
                          />
                        )}
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                  {/* HistoScan */}
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
                          justifyContent: sidebarVisible
                            ? "flex-start"
                            : "center",
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
                          <ListItemText
                            primary="HistoScan"
                            sx={{ opacity: 1 }}
                          />
                        )}
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                  {/* STORM Local */}
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
                          justifyContent: sidebarVisible
                            ? "flex-start"
                            : "center",
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
                          <ListItemText
                            primary="STORM Local"
                            sx={{ opacity: 1 }}
                          />
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
                          justifyContent: sidebarVisible
                            ? "flex-start"
                            : "center",
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
                          justifyContent: sidebarVisible
                            ? "flex-start"
                            : "center",
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
                  {/* Lightsheet */}
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
                          justifyContent: sidebarVisible
                            ? "flex-start"
                            : "center",
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
                          <ThreeDRotationIcon
                            sx={{ color: SIDEBAR_COLORS.apps }}
                          />
                        </ListItemIcon>
                        {sidebarVisible && (
                          <ListItemText
                            primary="LightSheet"
                            sx={{ opacity: 1 }}
                          />
                        )}
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                  {/* Demo */}
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
                          justifyContent: sidebarVisible
                            ? "flex-start"
                            : "center",
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
                  {/* Timelapse */}
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
                          justifyContent: sidebarVisible
                            ? "flex-start"
                            : "center",
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
                          <ListItemText
                            primary="Timelapse"
                            sx={{ opacity: 1 }}
                          />
                        )}
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                  {/* FlowStop */}
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
                          justifyContent: sidebarVisible
                            ? "flex-start"
                            : "center",
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
                          <ListItemText
                            primary="FlowStop"
                            sx={{ opacity: 1 }}
                          />
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
                          justifyContent: sidebarVisible
                            ? "flex-start"
                            : "center",
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
                  {/* MazeGame */}
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
                          justifyContent: sidebarVisible
                            ? "flex-start"
                            : "center",
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
                          <SportsEsportsIcon
                            sx={{ color: SIDEBAR_COLORS.apps }}
                          />
                        </ListItemIcon>
                        {sidebarVisible && (
                          <ListItemText
                            primary="Maze Game"
                            sx={{ opacity: 1 }}
                          />
                        )}
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                </List>
              </Collapse>
              <Divider sx={{ my: 1 }} />

              {/* File Manager */}
              <ListItem>
                <ListItemButton
                  selected={selectedPlugin === "FileManager"}
                  onClick={() => handlePluginChange("FileManager")}
                >
                  <ListItemIcon>
                    <FolderIcon sx={{ color: SIDEBAR_COLORS.fileManager }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={sidebarVisible ? "File Manager" : ""}
                  />
                </ListItemButton>
              </ListItem>
              <Divider sx={{ my: 1 }} />

              {/* Coding Group */}
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
                  {/* Fiji (ImJoy) */}
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
                  {/* Blockly */}
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
                  {/* JupyteNotebook */}
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

              {/* System Group */}
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
                  {/* Stresstest */}
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
                      <ListItemText
                        primary={sidebarVisible ? "Stresstest" : ""}
                      />
                    </ListItemButton>
                  </ListItem>
                  {/* Objective */}
                  <ListItem>
                    <ListItemButton
                      selected={selectedPlugin === "Objective"}
                      onClick={() => handlePluginChange("Objective")}
                    >
                      <ListItemIcon>
                        <ZoomOutMapIcon sx={{ color: SIDEBAR_COLORS.system }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={sidebarVisible ? "Objective" : ""}
                      />
                    </ListItemButton>
                  </ListItem>
                  {/* Focus Lock */}
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
                      <ListItemText
                        primary={sidebarVisible ? "Focus Lock" : ""}
                      />
                    </ListItemButton>
                  </ListItem>
                  {/* SocketView */}
                  <ListItem>
                    <ListItemButton
                      selected={selectedPlugin === "SocketView"}
                      onClick={() => handlePluginChange("SocketView")}
                    >
                      <ListItemIcon>
                        <CommentIcon sx={{ color: SIDEBAR_COLORS.system }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={sidebarVisible ? "SocketView" : ""}
                      />
                    </ListItemButton>
                  </ListItem>
                  {/* StageOffsetCalibration */}
                  <ListItem>
                    <ListItemButton
                      selected={selectedPlugin === "StageOffsetCalibration"}
                      onClick={() =>
                        handlePluginChange("StageOffsetCalibration")
                      }
                    >
                      <ListItemIcon>
                        <StraightenIcon sx={{ color: SIDEBAR_COLORS.system }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={sidebarVisible ? "StageOffsetCalibration" : ""}
                      />
                    </ListItemButton>
                  </ListItem>
                  {/* DetectorTrigger */}
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
                  {/* ExtendedLEDMatrix */}
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

              {/* Plugins */}
              {plugins.map((p) => (
                <ListItem key={p.name}>
                  <ListItemButton
                    selected={selectedPlugin === p.name}
                    onClick={() => setSelectedPlugin(p.name)}
                  >
                    <ListItemIcon>
                      {React.createElement(BuildIcon)}
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
                  <ListItemText
                    primary={sidebarVisible ? "System Settings" : ""}
                  />
                  {sidebarVisible &&
                    (groupsOpen.systemSettings ? (
                      <ExpandLess />
                    ) : (
                      <ExpandMore />
                    ))}
                </ListItemButton>
              </ListItem>
              <Collapse
                in={groupsOpen.systemSettings}
                timeout="auto"
                unmountOnExit
              >
                {/* WiFi */}
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
                {/* Connections */}
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
                  {/* UC2 */}
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
                  {/* Settings */}
                  <ListItem>
                    <ListItemButton
                      selected={selectedPlugin === "SystemSettings"}
                      onClick={() => handlePluginChange("SystemSettings")}
                    >
                      <ListItemIcon>
                        <SettingsIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={sidebarVisible ? "Settings" : ""}
                      />
                    </ListItemButton>
                  </ListItem>
                  {/* About */}
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

          <TopBar
            isMobile={isMobile}
            sidebarVisible={sidebarVisible}
            setSidebarVisible={setSidebarVisible}
            selectedPlugin={selectedPlugin}
            drawerWidth={drawerWidth}
          />

          {/* Main content area */}
          <Box
            component="main"
            sx={{
              top: 64,
              flexGrow: 1,
              display: "flex",
              position: "absolute",
              p: isMobile ? 1 : 3,
              left: drawerWidth,
              width: "calc(100% - " + drawerWidth + "px)",
              height: "calc(100vh - 64px)",
              marginLeft: !isMobile && sidebarVisible ? 0 : 0,
              transition: (theme) =>
                theme.transitions.create(["margin", "padding"], {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.leavingScreen,
                }),
              minHeight: "calc(100vh - 64px)",
              overflow: "hidden",
            }}
          >
            {selectedPlugin === "LiveView" && (
              <LiveView
                // pass down a setter or context for the image if needed
                onImageUpdate={(img) => setSharedImage(img)}
                setSelectedPlugin={setSelectedPlugin}
                setFileManagerInitialPath={handleFileManagerInitialPathChange} // pass function
              />
            )}

            {selectedPlugin === "WellPlate" && <AxonTabComponent />}

            {selectedPlugin === "ImJoy" && (
              <ImJoyView sharedImage={sharedImage} />
            )}
            {selectedPlugin === "HistoScan" && <HistoScanController />}
            {selectedPlugin === "STORMLocal" && <STORMControllerLocal />}
            {selectedPlugin === "STORMArkitekt" && <STORMControllerArkitekt />}
            {selectedPlugin === "Stresstest" && <StresstestController />}
            {selectedPlugin === "FocusLock" && <FocusLockController />}
            {selectedPlugin === "JupyteNotebook" && (
              <JupyterProvider>
                <JupyterExecutor />
              </JupyterProvider>
            )}
            {selectedPlugin === "Infinity Scanning" && (
              <LargeFovScanController />
            )}
            {selectedPlugin === "Blockly" && <BlocklyController />}
            {selectedPlugin === "Timelapse" && (
              <MCTProvider>
                <TimelapseController />
              </MCTProvider>
            )}
            {selectedPlugin === "Objective" && <ObjectiveController />}
            {selectedPlugin === "About" && <AboutPage />}
            {selectedPlugin === "SystemSettings" && <SystemSettings />}
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
            {selectedPlugin === "FlowStop" && <FlowStopController />}
            {selectedPlugin === "StageOffsetCalibration" && (
              <StageOffsetCalibration hostIP={hostIP} hostPort={apiPort} />
            )}
            {selectedPlugin === "UC2" && (
              <UC2Controller hostIP={hostIP} hostPort={apiPort} />
            )}
            {selectedPlugin === "DetectorTrigger" && (
              <DetectorTriggerController />
            )}
            {selectedPlugin === "ExtendedLEDMatrix" && (
              <ExtendedLEDMatrixController
                hostIP={hostIP}
                hostPort={apiPort}
                layout={layout}
                onLayoutChange={(newLayout) => setLayout(newLayout)}
              />
            )}
            {selectedPlugin === "Lepmon" && <LepMonController />}
            {selectedPlugin === "MazeGame" && <MazeGameController />}
            {selectedPlugin === "SocketView" && <SocketView />}
            {selectedPlugin === "Connections" && <ConnectionSettings />}
          </Box>
        </Box>
      </WebSocketProvider>
    </ThemeProvider>
  );
}

export default App;

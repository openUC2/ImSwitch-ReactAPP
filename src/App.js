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
import { LiveWidgetProvider } from "./context/LiveWidgetContext"; // Import the context provider
import Tab_Widgets from "./components/Tab_Widgets";
import LightsheetController from "./components/LightsheetController";
import BlocklyController from "./components/BlocklyController";
import ImJoyView from "./components/ImJoyView";
import JupyterExecutor from "./components/JupyterExecutor";
import { JupyterProvider } from "./context/JupyterContext";
import UC2Controller from "./components/UC2Controller";
import ExtendedLEDMatrixController from "./components/ExtendedLEDMatrixController";
import StageOffsetCalibration from "./components/StageOffsetCalibrationController";
import DetectorTriggerController from "./components/DetectorTriggerController";

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
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { WidgetContextProvider } from "./context/WidgetContext";
import CommentIcon from "@mui/icons-material/Comment";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import FlowStopController from "./components/FlowStopController";
import SepMonController from "./components/SepmonController";

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
  const [sidebarVisible, setSidebarVisible] = useState(true); // Sidebar visibility state
  const drawerWidth = sidebarVisible ? 240 : 60; // Full width when open, minimized when hidden

  const [hostIP, setHostIP] = useState(connectionSettingsState.ip);
  //const [hostPort, sethostPort] = useState(connectionSettingsState.port);
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

  /*
  FileManager
  */
  const fileUploadConfig = {
    url: `https://${hostIP}:${apiPort}/upload`, // Change this as per your API URL
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

  /*
  On Value Changes
  */

  useEffect(() => {
    const currentHostname = window.location.hostname;
    const portsToCheck = [8001, 8002, 443];

    const findValidPort = async () => {
      try {
        const validPort = await checkPortsForApi(currentHostname, portsToCheck);
        setHostIP(`https://${currentHostname}`);
        setApiPort(validPort);
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
    api.defaults.baseURL = `${hostIP}:${apiPort}/FileManager`;
    handleRefresh();
  }, [hostIP, apiPort]);

  // Dialog handlers for the URL / Port settings
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Open the dialog
  const handleOpenDialog = () => {
    setDialogOpen(true);
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
  setTimeout(() => {
    handleRefresh();
  }, 2000);
  setFileManagerInitialPath(path);
  setSelectedPlugin("FileManager"); 
};

  // Handle changes to the port
  const handlehostIPChange = (event) => {
    let ip = event.target.value.trim();
    if (!ip.startsWith("http://") && !ip.startsWith("https://")) {
      ip = "https://" + ip;
    }
    if (ip.startsWith("http://")) {
      ip = ip.replace("http://", "https://");
    }
    setHostIP(ip);
  };

  // Save the IP address and port
  const handleSavehostIP = () => {
    setHostIP(hostIP);
    setApiPort(apiPort);
    setWebsocketPort(websocketPort);
    handleCloseDialog();

    //redux
    dispatch(connectionSettingsSlice.setIp(hostIP));
    dispatch(connectionSettingsSlice.setWebsocketPort(websocketPort));
    dispatch(connectionSettingsSlice.setApiPort(apiPort));
  };

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  const handlePluginChange = (plugin) => {
    setSelectedPlugin(plugin);
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
              <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: "bold" }}>
                Microscope Control
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Light/dark
              </Typography>
              <Switch
                checked={isDarkMode}
                onChange={toggleTheme}
                color="default"
                inputProps={{ "aria-label": "toggle theme" }}
              />
              <Avatar src={uc2Logo} />
            </Toolbar>
          </AppBar>

          {/* Sidebar Drawer with minimized mode */}
          <Drawer
            variant="permanent"
            open={sidebarVisible}
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              "& .MuiDrawer-paper": {
                width: drawerWidth,
                boxSizing: "border-box",
                top: 64, // Position below the AppBar
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
              {/* WellPlate */}
              <ListItem
                button
                selected={selectedPlugin === "WellPlate"}
                onClick={() => handlePluginChange("WellPlate")}
              >
                <ListItemIcon>
                  <SettingsOverscanSharpIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "WellPlate" : ""} />
              </ListItem>

              {/* FileManager */}
              <ListItem
                button
                selected={selectedPlugin === "FileManager"}
                onClick={() => handlePluginChange("FileManager")}
              >
                <ListItemIcon>
                  <DevicesIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "File Manager" : ""} />
              </ListItem>
              {/* HistoScan */}
              <ListItem
                button
                selected={selectedPlugin === "HistoScan"}
                onClick={() => handlePluginChange("HistoScan")}
              >
                <ListItemIcon>
                  <SettingsOverscanSharpIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "HistoScan" : ""} />
              </ListItem>
              {/* JupyteNotebook */}
              <ListItem
                button
                selected={selectedPlugin === "JupyterNotebook"}
                onClick={() => handlePluginChange("JupyteNotebook")}
              >
                <ListItemIcon>
                  <SettingsOverscanSharpIcon />
                </ListItemIcon>
                <ListItemText
                  primary={sidebarVisible ? "JupyteNotebook" : ""}
                />
              </ListItem>
              {/* Infinity Scanning */}
              <ListItem
                button
                selected={selectedPlugin === "Infinity Scanning"}
                onClick={() => handlePluginChange("Infinity Scanning")}
              >
                <ListItemIcon>
                  <SettingsOverscanSharpIcon />
                </ListItemIcon>
                <ListItemText
                  primary={sidebarVisible ? "Infinity Scanning" : ""}
                />
              </ListItem>
              {/* Blockly */}
              <ListItem
                button
                selected={selectedPlugin === "Blockly"}
                onClick={() => handlePluginChange("Blockly")}
              >
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "Blockly" : ""} />
              </ListItem>
              {/* Timelapse */}
              <ListItem
                button
                selected={selectedPlugin === "Timelapse"}
                onClick={() => handlePluginChange("Timelapse")}
              >
                <ListItemIcon>
                  <AccessTimeIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "Timelapse" : ""} />
              </ListItem>
              {/* Objective */}
              <ListItem
                button
                selected={selectedPlugin === "Objective"}
                onClick={() => handlePluginChange("Objective")}
              >
                <ListItemIcon>
                  <ZoomOutMapIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "Objective" : ""} />
              </ListItem>
              {/* SocketView */}
              <ListItem
                button
                selected={selectedPlugin === "SocketView"}
                onClick={() => handlePluginChange("SocketView")}
              >
                <ListItemIcon>
                  <CommentIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "SocketView" : ""} />
              </ListItem>
              {/* Lightsheet */}
              <ListItem
                button
                selected={selectedPlugin === "Lightsheet_"}
                onClick={() => handlePluginChange("Lightsheet_")}
              >
                <ListItemIcon>
                  <ThreeDRotationIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "Lightsheet_" : ""} />
              </ListItem>
              {/* FlowStop */}
              <ListItem
                button
                selected={selectedPlugin === "FlowStop"}
                onClick={() => handlePluginChange("FlowStop")}
              >
                <ListItemIcon>
                  <AirIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "FlowStop" : ""} />
              </ListItem>
              {/* Widgets */}
              <ListItem
                button
                selected={selectedPlugin === "Sepmon"}
                onClick={() => handlePluginChange("Sepmon")}
              >
                <ListItemIcon>
                  <AirIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "Sepmon" : ""} />
              </ListItem>
              {/* StageOffsetCalibration */}
              <ListItem
                button
                selected={selectedPlugin === "StageOffsetCalibration"}
                onClick={() => handlePluginChange("StageOffsetCalibration")}
              >
                <ListItemIcon>
                  <AirIcon />
                </ListItemIcon>
                <ListItemText
                  primary={sidebarVisible ? "StageOffsetCalibration" : ""}
                />
              </ListItem>
              {/* UC2 */}
              <ListItem
                button
                selected={selectedPlugin === "UC2"}
                onClick={() => handlePluginChange("UC2")}
              >
                <ListItemIcon>
                  <AirIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "UC2" : ""} />
              </ListItem>
              <ListItem
                button
                selected={selectedPlugin === "DetectorTrigger"}
                onClick={() => handlePluginChange("DetectorTrigger")}
              >
                <ListItemIcon>
                  <AirIcon />
                </ListItemIcon>
                <ListItemText
                  primary={sidebarVisible ? "DetectorTrigger" : ""}
                />
              </ListItem>
              <ListItem
                button
                selected={selectedPlugin === "ExtendedLEDMatrix"}
                onClick={() => handlePluginChange("ExtendedLEDMatrix")}
              >
                <ListItemIcon>
                  <AirIcon />
                </ListItemIcon>
                <ListItemText
                  primary={sidebarVisible ? "ExtendedLEDMatrix" : ""}
                />
              </ListItem>
              <ListItem button onClick={() => handlePluginChange("Widgets")}>
                <ListItemIcon>
                  <DevicesIcon />
                </ListItemIcon>
                <ListItemText
                  selected={selectedPlugin === "Widgets"}
                  primary={sidebarVisible ? "Widgets" : ""}
                />
              </ListItem>
              {/* Connections */}
              <ListItem
                button
                selected={selectedPlugin === "Connectoins"}
                onClick={handleOpenDialog}
              >
                <ListItemIcon>
                  <WifiSharpIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "Connections" : ""} />
              </ListItem>
              {/* About */}
              <ListItem
                button
                selected={selectedPlugin === "About"}
                onClick={() => handlePluginChange("About")}
              >
                <ListItemIcon>
                  <InfoIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "About" : ""} />
              </ListItem>
              {/* System Settings */}
              <ListItem
                button
                selected={selectedPlugin === "SystemSettings"}
                onClick={() => handlePluginChange("SystemSettings")}
              >
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "Settings" : ""} />
              </ListItem>

              {/* ImJoy */}
              <ListItem
                button
                selected={selectedPlugin === "ImJoy"}
                onClick={() => handlePluginChange("ImJoy")}
              >
                <ListItemIcon>
                  <BuildIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "Fiji" : ""} />
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
            sx={{ flexGrow: 1, p: 3, marginTop: "64px" }} // Push content below AppBar
          >
            {selectedPlugin === "WellPlate" && <AxonTabComponent />}
            <Box
              sx={{ display: selectedPlugin === "LiveView" ? "block" : "none" }}
            >
              <LiveWidgetProvider>
                <LiveView
                  hostIP={hostIP}
                  hostPort={apiPort}
                  drawerWidth={drawerWidth}
                  // pass down a setter or context for the image if needed
                  onImageUpdate={(img) => setSharedImage(img)}
                  setSelectedPlugin={setSelectedPlugin}
                  setFileManagerInitialPath={handleFileManagerInitialPathChange} // pass function
                />
              </LiveWidgetProvider>
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
              <WidgetContextProvider>
                <HistoScanController hostIP={hostIP} hostPort={apiPort} />
              </WidgetContextProvider>
            )}
            {selectedPlugin === "JupyteNotebook" && (
              <JupyterProvider>
                <JupyterExecutor hostIP={hostIP} hostPort={apiPort} />
              </JupyterProvider>
            )}
            {selectedPlugin === "Infinity Scanning" && (
              <WidgetContextProvider>
                <LargeFovScanController hostIP={hostIP} hostPort={apiPort} />
              </WidgetContextProvider>
            )}
            {selectedPlugin === "Blockly" && (
              <WidgetContextProvider>
                <BlocklyController />
              </WidgetContextProvider>
            )}
            {selectedPlugin === "Timelapse" && (
              <WidgetContextProvider>
                <MCTProvider>
                  <TimelapseController
                    hostIP={hostIP}
                    hostPort={apiPort}
                    title="Timelapse"
                  />
                </MCTProvider>
              </WidgetContextProvider>
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
            {selectedPlugin === "Lightsheet_" && (
              <WidgetContextProvider>
                <LightsheetController hostIP={hostIP} hostPort={apiPort} />
              </WidgetContextProvider>
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
              <WidgetContextProvider>
                <FlowStopController hostIP={hostIP} hostPort={apiPort} />
              </WidgetContextProvider>
            )}
            {selectedPlugin === "StageOffsetCalibration" && (
              <WidgetContextProvider>
                <StageOffsetCalibration hostIP={hostIP} hostPort={apiPort} />
              </WidgetContextProvider>
            )}
            {selectedPlugin === "UC2" && (
              <WidgetContextProvider>
                <UC2Controller hostIP={hostIP} hostPort={apiPort} />
              </WidgetContextProvider>
            )}
            {selectedPlugin === "DetectorTrigger" && (
              <WidgetContextProvider>
                <DetectorTriggerController hostIP={hostIP} hostPort={apiPort} />
              </WidgetContextProvider>
            )}
            {selectedPlugin === "ExtendedLEDMatrix" && (
              <WidgetContextProvider>
                <ExtendedLEDMatrixController
                  hostIP={hostIP}
                  hostPort={apiPort}
                  layout={layout}
                  onLayoutChange={(newLayout) => setLayout(newLayout)}
                />
              </WidgetContextProvider>
            )}
            {selectedPlugin === "Sepmon" && (
              <WidgetContextProvider>
                <SepMonController hostIP={hostIP} hostPort={apiPort} />
              </WidgetContextProvider>
            )}
            {selectedPlugin === "SocketView" && (
              <SocketView hostIP={hostIP} hostPort={websocketPort} />
            )}
            {selectedPlugin === "Widgets" && (
              <WidgetContextProvider>
                <Tab_Widgets
                  hostIP={hostIP}
                  hostPort={apiPort}
                  layout={layout}
                  onLayoutChange={(newLayout) => setLayout(newLayout)}
                />
              </WidgetContextProvider>
            )}
          </Box>

          {/* IP Address Dialog */}
          <Dialog open={isDialogOpen} onClose={handleCloseDialog}>
            <DialogTitle>Enter IP Address</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                id="ip-address"
                label="IP Address"
                type="text"
                fullWidth
                value={hostIP}
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

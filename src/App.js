import React, { useRef, useState, useEffect } from "react";
import LiveView from "./components/LiveView";
import SocketView from "./components/SocketView";
import HistoScanController from "./components/HistoScanController";
import { LiveWidgetProvider } from "./context/LiveWidgetContext"; // Import the context provider
import Tab_Widgets from "./components/Tab_Widgets";
import LightsheetController from "./components/LightsheetController";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Devices as DevicesIcon,
  Build as BuildIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  SettingsOverscanSharp as SettingsOverscanSharpIcon,
} from "@mui/icons-material";
import WifiSharpIcon from "@mui/icons-material/WifiSharp";
import ThreeDRotationIcon from "@mui/icons-material/ThreeDRotation";
import AirIcon from "@mui/icons-material/Air";
import axios from "axios";
import { WebSocketProvider } from "./context/WebSocketContext";

// Filemanager
import FileManager from "./FileManager/FileManager/FileManager";
import { createFolderAPI } from "./FileManager/api/createFolderAPI";
import { renameAPI } from "./FileManager/api/renameAPI";
import { deleteAPI } from "./FileManager/api/deleteAPI";
import { copyItemAPI, moveItemAPI } from "./FileManager/api/fileTransferAPI";
import { getAllFilesAPI } from "./FileManager/api/getAllFilesAPI";
import { downloadFile } from "./FileManager/api/downloadFileAPI";

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
import FlowStopController from "./components/FlowStopController";

// Define both light and dark themes
const lightTheme = createTheme({
  palette: {
    mode: "light",
  },
  typography: {
    fontFamily: "Roboto",
    fontWeightBold: 700,
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
});

function App() {
  /*
  States
  */
  const [sidebarVisible, setSidebarVisible] = useState(true); // Sidebar visibility state
  const drawerWidth = sidebarVisible ? 240 : 60; // Full width when open, minimized when hidden
  const [hostIP, setHostIP] = useState(`https://${window.location.hostname}`);
  const [hostPort, sethostPort] = useState(8001);
  const [selectedPlugin, setSelectedPlugin] = useState("LiveView"); // Control which plugin to show
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // State to toggle between light and dark themes
  const [layout, setLayout] = useState([
    { i: "widget1", x: 0, y: 0, w: 2, h: 2 },
    { i: "widget2", x: 2, y: 0, w: 2, h: 2 },
    { i: "widget3", x: 4, y: 0, w: 2, h: 2 },
    { i: "FlowStop", x: 6, y: 0, w: 5, h: 5 },
    { i: "Lightsheet", x: 0, y: 2, w: 5, h: 5 },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const isMountRef = useRef(false);

  /*
  FileManager
  */
  const fileUploadConfig = {
    url: "http://localhost:4000/upload", // Change this as per your API URL
  };

  // Fetch Files
  const getFiles = async () => {
    setIsLoading(true);
    const response = await getAllFilesAPI();
    setFiles(response.data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isMountRef.current) return;
    isMountRef.current = true;
    getFiles();
  }, []);

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
    await downloadFile(files);
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
        sethostPort(validPort);
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

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handlehostPortChange = (event) => {
    let port = event.target.value.trim();
    sethostPort(port);
  };

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

  const handleSavehostIP = () => {
    setHostIP(hostIP);
    sethostPort(hostPort);
    handleCloseDialog();
  };

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  const handlePluginChange = (plugin) => {
    setSelectedPlugin(plugin);
  };

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
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
              <Avatar src="/logo192.png" />
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
            <List>
              <ListItem button onClick={() => handlePluginChange("LiveView")}>
                <ListItemIcon>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "Live View" : ""} />
              </ListItem>
              <ListItem
                button
                onClick={() => handlePluginChange("FileManager")}
              >
                <ListItemIcon>
                  <DevicesIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "File Manager" : ""} />
              </ListItem>
              <ListItem button onClick={() => handlePluginChange("HistoScan")}>
                <ListItemIcon>
                  <SettingsOverscanSharpIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "HistoScan" : ""} />
              </ListItem>
              <ListItem button onClick={() => handlePluginChange("SocketView")}>
                <ListItemIcon>
                  <CommentIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "SocketView" : ""} />
              </ListItem>
              <ListItem button onClick={() => handlePluginChange("Lightsheet")}>
                <ListItemIcon>
                  <ThreeDRotationIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "Lightsheet" : ""} />
              </ListItem>
              <ListItem button onClick={() => handlePluginChange("FlowStop")}>
                <ListItemIcon>
                  <AirIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "FlowStop" : ""} />
              </ListItem>
              <ListItem button onClick={() => handlePluginChange("Widgets")}>
                <ListItemIcon>
                  <DevicesIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "Widgets" : ""} />
              </ListItem>
              <ListItem button onClick={handleOpenDialog}>
                <ListItemIcon>
                  <WifiSharpIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "Connections" : ""} />
              </ListItem>
              <ListItem button onClick={() => handlePluginChange("About")}>
                <ListItemIcon>
                  <InfoIcon />
                </ListItemIcon>
                <ListItemText primary={sidebarVisible ? "About" : ""} />
              </ListItem>

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
            {selectedPlugin === "LiveView" && (
              <LiveWidgetProvider>
                <LiveView hostIP={hostIP} hostPort={hostPort} />
              </LiveWidgetProvider>
            )}
            {selectedPlugin === "HistoScan" && (
              <WidgetContextProvider>
                <HistoScanController hostIP={hostIP} hostPort={hostPort} />
              </WidgetContextProvider>
            )}
            {selectedPlugin === "FileManager" && (
              <FileManager
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
                filePreviewPath={"http://localhost:4000"}
                acceptedFileTypes=".txt, .png, .jpg, .jpeg, .pdf, .doc, .docx, .exe, .js, .csv"
                height="100%"
                width="100%"
              />
            )}
            {selectedPlugin === "Lightsheet" && (
              <WidgetContextProvider>
                <LightsheetController hostIP={hostIP} hostPort={hostPort} />
              </WidgetContextProvider>
            )}
            {selectedPlugin === "FlowStop" && (
              <WidgetContextProvider>
                <FlowStopController hostIP={hostIP} hostPort={hostPort} />
              </WidgetContextProvider>
            )}
            {selectedPlugin === "SocketView" && (
              <SocketView hostIP={hostIP} hostPort={hostPort} />
            )}
            {selectedPlugin === "Widgets" && (
              <WidgetContextProvider>
                <Tab_Widgets
                  hostIP={hostIP}
                  hostPort={hostPort}
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
                id="port"
                label="Port"
                type="text"
                fullWidth
                value={hostPort}
                onChange={handlehostPortChange}
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

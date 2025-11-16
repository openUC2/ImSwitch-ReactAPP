/* global __webpack_init_sharing__, __webpack_share_scopes__ */
import { lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { darkTheme, lightTheme } from "./themes";
import HomePage from "./pages/HomePage.jsx";
import { NavigationDrawer, TopBar } from "./components/navigation";
import { setApiPort, setIp } from "./state/slices/ConnectionSettingsSlice.js";
import WebSocketHandler from "./middleware/WebSocketHandler.js";

//redux
import { useDispatch, useSelector } from "react-redux";
import StatusMessage from "./components/StatusMessage.js";
import * as connectionSettingsSlice from "./state/slices/ConnectionSettingsSlice.js";
import {
  clearNotification,
  getNotificationState,
} from "./state/slices/NotificationSlice.js";
import { getThemeState } from "./state/slices/ThemeSlice.js";

// Filemanager
import { api } from "./FileManager/api/api.js";
import { createFolderAPI } from "./FileManager/api/createFolderAPI.js";
import { deleteAPI } from "./FileManager/api/deleteAPI.js";
import { downloadFile } from "./FileManager/api/downloadFileAPI.js";
import { copyItemAPI, moveItemAPI } from "./FileManager/api/fileTransferAPI.js";
import { getAllFilesAPI } from "./FileManager/api/getAllFilesAPI.js";
import { renameAPI } from "./FileManager/api/renameAPI.js";
import "./FileManager/App.scss";

import { Box, CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";

function App() {
  // Notification state
  const notification = useSelector(getNotificationState);
  const dispatch = useDispatch();

  // Access global Redux state
  const connectionSettingsState = useSelector(
    connectionSettingsSlice.getConnectionSettingsState
  );
  const { isDarkMode } = useSelector(getThemeState);

  // Hook to detect mobile screens
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarVisible, setSidebarVisible] = useState(window.innerWidth > 768); // Sidebar visibility state - hidden by default on mobile
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
  const apiPort = connectionSettingsState.apiPort;

  const [selectedPlugin, setSelectedPlugin] = useState("LiveView"); // Control which plugin to show
  const [sharedImage, setSharedImage] = useState(null);
  const [fileManagerInitialPath, setFileManagerInitialPath] = useState("/");
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState([]);

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

  /*
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
  };*/

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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hostIP, apiPort]); // Re-run if hostIP or apiPort changes

    return widgets;
  }
  const plugins = usePluginWidgets();

  return (
    <BrowserRouter>
      <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
        <WebSocketHandler />
        {/* headless */}
        {/* REMOVED: WebSocketProvider - duplicate socket connection */}
        <CssBaseline />

        {/* Global Status/Notification Message */}
        <StatusMessage
          message={notification.message}
          type={notification.type}
          onClose={() => dispatch(clearNotification())}
        />

        <Box sx={{ display: "flex" }}>
          <NavigationDrawer
            sidebarVisible={sidebarVisible}
            setSidebarVisible={setSidebarVisible}
            isMobile={isMobile}
            drawerWidth={drawerWidth}
            selectedPlugin={selectedPlugin}
            handlePluginChange={handlePluginChange}
            plugins={plugins}
          />

          <TopBar
            isMobile={isMobile}
            sidebarVisible={sidebarVisible}
            setSidebarVisible={setSidebarVisible}
            selectedPlugin={selectedPlugin}
            drawerWidth={drawerWidth}
            onSettingsNavigate={handlePluginChange} // Pass existing navigation handler
          />

          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  // Pass all necessary props to HomePage
                  isMobile={isMobile}
                  drawerWidth={drawerWidth}
                  sidebarVisible={sidebarVisible}
                  selectedPlugin={selectedPlugin}
                  sharedImage={sharedImage}
                  hostIP={hostIP}
                  apiPort={apiPort}
                  files={files}
                  fileUploadConfig={fileUploadConfig}
                  isLoading={isLoading}
                  fileManagerInitialPath={fileManagerInitialPath}
                  plugins={plugins}
                  handleFileManagerInitialPathChange={
                    handleFileManagerInitialPathChange
                  }
                  handleCreateFolder={handleCreateFolder}
                  handleFileUploading={handleFileUploading}
                  handleFileUploaded={handleFileUploaded}
                  handlePaste={handlePaste}
                  handleRename={handleRename}
                  handleDownload={handleDownload}
                  handleOpenWithImJoy={handleOpenWithImJoy}
                  handleDelete={handleDelete}
                  handleRefresh={handleRefresh}
                  handlePluginChange={handlePluginChange}
                />
              }
            />
          </Routes>
        </Box>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;

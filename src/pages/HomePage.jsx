import React, { Suspense } from "react";
import { Box } from "@mui/material";
import { JupyterProvider } from "../context/JupyterContext.js";
import { MCTProvider } from "../context/MCTContext.js";

// Import all existing components
import AboutPage from "../components/AboutPage.js";
import BlocklyController from "../components/BlocklyController.js";
import ConnectionSettings from "../components/ConnectionSettings.jsx";
import DetectorTriggerController from "../components/DetectorTriggerController.js";
import ExtendedLEDMatrixController from "../components/ExtendedLEDMatrixController.jsx";
import FlowStopController from "../components/FlowStopController.js";
import FocusLockController from "../components/FocusLockController.js";
import ImJoyView from "../components/ImJoyView.js";
import JupyterExecutor from "../components/JupyterExecutor.js";
import LepMonController from "../components/LepmonController.js";
import LightsheetController from "../components/LightsheetController.jsx";
import LiveView from "../components/LiveView.js";
import MazeGameController from "../components/MazeGameController.js";
import ObjectiveController from "../components/ObjectiveController.js";
import LargeFovScanController from "../components/OpenLayers.js";
import SocketView from "../components/SocketView.js";
import StageOffsetCalibration from "../components/StageOffsetCalibrationController.jsx";
import STORMControllerArkitekt from "../components/STORMControllerArkitekt.js";
import STORMControllerLocal from "../components/STORMControllerLocal.js";
import StresstestController from "../components/StresstestController.js";
import SystemSettings from "../components/SystemSettings.js";
import SystemUpdateController from "../components/SystemUpdateController.jsx";
import TimelapseController from "../components/TimelapseController.js";
import UC2ConfigurationController from "../components/UC2ConfigurationController.jsx";
import SerialDebugController from "../components/SerialDebugController.jsx";
import WiFiController from "../components/WiFiController.jsx";
import AppManagerPage from "../components/AppManagerPage.jsx";

// Axon
import AxonTabComponent from "../axon/AxonTabComponent.js";

// FileManager
import FileManager from "../FileManager/FileManager";

/**
 * HomePage - Contains all the original ImSwitch app functionality
 */
const HomePage = ({
  isMobile,
  drawerWidth,
  sidebarVisible,
  selectedPlugin,
  sharedImage,
  hostIP,
  apiPort,
  files,
  fileUploadConfig,
  isLoading,
  fileManagerInitialPath,
  plugins,
  handleFileManagerInitialPathChange,
  handleCreateFolder,
  handleFileUploading,
  handleFileUploaded,
  handlePaste,
  handleRename,
  handleDownload,
  handleOpenWithImJoy,
  handleDelete,
  handleRefresh,
  handlePluginChange,
}) => {
  return (
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
        overflow: "auto",
      }}
    >
      {selectedPlugin === "LiveView" && (
        <LiveView
          setFileManagerInitialPath={handleFileManagerInitialPathChange}
        />
      )}

      {selectedPlugin === "WellPlate" && <AxonTabComponent />}
      {selectedPlugin === "ImJoy" && <ImJoyView sharedImage={sharedImage} />}
      {selectedPlugin === "STORMLocal" && <STORMControllerLocal />}
      {selectedPlugin === "STORMArkitekt" && <STORMControllerArkitekt />}
      {selectedPlugin === "Stresstest" && <StresstestController />}
      {selectedPlugin === "FocusLock" && <FocusLockController />}
      {selectedPlugin === "JupyterNotebook" && (
        <JupyterProvider>
          <JupyterExecutor />
        </JupyterProvider>
      )}
      {selectedPlugin === "Infinity Scanning" && <LargeFovScanController />}
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
        <div className="app" style={{ width: "100%", maxWidth: "100%" }}>
          <div
            className="file-manager-container"
            style={{ width: "100%", maxWidth: "100%" }}
          >
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
              layout="list"
              enableFilePreview
              maxFileSize={10485760}
              filePreviewPath={`${hostIP}:${apiPort}/`}
              acceptedFileTypes=".txt, .png, .jpg, .jpeg, .pdf, .doc, .docx, .exe, .js, .csv"
              initialPath={fileManagerInitialPath}
            />
          </div>
        </div>
      )}
      {selectedPlugin === "AppManager" && (
        <AppManagerPage onNavigateToApp={handlePluginChange} />
      )}
      {selectedPlugin === "LightSheet" && <LightsheetController />}
      {selectedPlugin === "WiFi" && <WiFiController />}
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
        <StageOffsetCalibration />
      )}
      {selectedPlugin === "UC2" && <UC2ConfigurationController />}
      {selectedPlugin === "SerialDebug" && <SerialDebugController />}
      {selectedPlugin === "DetectorTrigger" && <DetectorTriggerController />}
      {selectedPlugin === "ExtendedLEDMatrix" && (
        <ExtendedLEDMatrixController />
      )}
      {selectedPlugin === "Lepmon" && <LepMonController />}
      {selectedPlugin === "MazeGame" && <MazeGameController />}
      {selectedPlugin === "SocketView" && <SocketView />}
      {selectedPlugin === "SystemUpdate" && <SystemUpdateController />}
      {selectedPlugin === "Connections" && <ConnectionSettings />}
    </Box>
  );
};

export default HomePage;

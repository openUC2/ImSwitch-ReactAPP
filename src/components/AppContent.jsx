import React from "react";
import { Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

// ImSwitch Navigation Drawer
import { NavigationDrawer, TopBar } from "../components/navigation";

const AppContent = ({
  sidebarVisible,
  setSidebarVisible,
  isMobile,
  drawerWidth,
  selectedPlugin,
  handlePluginChange,
  plugins,
  children,
}) => {
  const navigate = useNavigate();

  return (
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
        onSettingsNavigate={handlePluginChange}
      />

      <Box
        component="main"
        sx={{
          top: 64,
          flexGrow: 1,
          p: 0,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          height: "100vh",
          overflow: "auto",
        }}
      >
        {/* Test-Button für Routing */}
        <Box sx={{ p: 1, borderBottom: "1px solid #eee" }}>
          <Button
            size="small"
            onClick={() => navigate("/test")}
            variant="outlined"
          >
            🧪 Test Routing
          </Button>
        </Box>

        {children}
      </Box>
    </Box>
  );
};

export default AppContent;

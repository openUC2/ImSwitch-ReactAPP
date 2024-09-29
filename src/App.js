import React, { useState, useEffect } from "react";
import Tab_LiveView from "./components/Tab_LiveView";
import { LiveWidgetProvider } from "./context/LiveWidgetContext"; // Import the context provider
import Tab_Widgets from "./components/Tab_Widgets";
import { Menu as MenuIcon } from "@mui/icons-material";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Container,
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  CssBaseline,
  Avatar,
  Tab,
  Switch,
  Tabs,
  FormControl,
  InputLabel,
  Input,
  FormHelperText,
  TextField,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { WidgetContextProvider } from "./context/WidgetContext";

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hostIP, setHostIP] = useState("https://localhost");
  const [hostPort, sethostPort] = useState(8001);
  const [selectedTab, setSelectedTab] = useState(0);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // State to toggle between light and dark themes
  const [layout, setLayout] = useState([
    { i: "widget1", x: 0, y: 0, w: 2, h: 2 },
    { i: "widget2", x: 2, y: 0, w: 2, h: 2 },
    { i: "widget3", x: 4, y: 0, w: 2, h: 2 },
    { i: "FlowStop", x: 6, y: 0, w: 5, h: 5 },
  ]);

  useEffect(() => {
    const currentHostname = window.location.hostname;
    if (!currentHostname.startsWith("youseetoo.github.io")) {
      setHostIP(`https://${currentHostname}`);
    }
  }, []);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleOpenDialog = () => {
    hostIP === "" ? setHostIP(hostIP) : setHostIP(hostIP);
    hostPort === "" ? sethostPort(hostPort) : sethostPort(hostPort);
    setDialogOpen(true);
  };

  const handlehostPortChange = (event) => {
    let port = event.target.value.trim();
    sethostPort(port);
  };
  const handlehostIPChange = (event) => {
    let ip = event.target.value.trim();

    // Check if it starts with 'http://' or 'https://', if not, prepend 'https://'
    if (!ip.startsWith("http://") && !ip.startsWith("https://")) {
      ip = "https://" + ip;
    }

    // Replace 'http://' with 'https://' if present
    if (ip.startsWith("http://")) {
      ip = ip.replace("http://", "https://");
    }

    setHostIP(ip);
  };

  const handleSavehostIP = () => {
    console.log("IP Address saved:", hostIP, hostPort);

    setHostIP(hostIP);
    sethostPort(hostPort);
    handleCloseDialog();
  };

  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      {/* <AppBar position="fixed">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => setDrawerOpen(!drawerOpen)}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: "bold" }}>
            Microscope Control
          </Typography>
          <Switch
            checked={isDarkMode}
            onChange={toggleTheme}
            color="default"
            inputProps={{ 'aria-label': 'toggle theme' }}
          />
          <Avatar src="/logo192.png" />
        </Toolbar>
      </AppBar> */}

      {/* <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <List>
          {[
            "My Collection",
            "Connections",
            "Devices",
            "Workflows",
            "Remote Demo",
            "About",
          ].map((text) => (
            <ListItem
              button
              onClick={() => text === "Connections" && handleOpenDialog()}
            >
              <Typography variant="h6" fontWeight="bold">
                {" "}
                {text}{" "}
              </Typography>
            </ListItem>
          ))}
        </List>
      </Drawer> */}

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

      <Tabs
        value={selectedTab}
        onChange={handleTabChange}
        variant="fullWidth"
        indicatorColor="secondary"
        textColor="inherit"
        style={{ marginTop: 64 }}
      >
        <Tab label="Live Parameters" />
        <Tab label="Plugins" />
      </Tabs>
      <WidgetContextProvider>
        <LiveWidgetProvider>
          {/* Render different components based on the selected tab */}
          {selectedTab === 0 && (
            <div>{<Tab_LiveView hostIP={hostIP} hostPort={hostPort} />}</div>
          )}
          {selectedTab === 1 && (
            <div>
              {
                <Tab_Widgets
                  hostIP={hostIP}
                  hostPort={hostPort}
                  layout={layout}
                  onLayoutChange={(newLayout) => setLayout(newLayout)}
                />
                /* Components for Control Panel 2 */
              }
            </div>
          )}
          {/* Add more conditional rendering for additional tabs */}
        </LiveWidgetProvider>
      </WidgetContextProvider>
    </ThemeProvider>
  );
}

export default App;

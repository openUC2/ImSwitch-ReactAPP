import React, { useRef, useState } from "react";

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
  TextField,
  Avatar,
} from "@mui/material";
import {
  Menu as MenuIcon,
  PlayArrow,
  Stop,
} from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import XYZControls from "./XYZControls"; // Assuming XYZControls is in the same directory

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
  const videoRef = useRef(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [streamUrl, setStreamUrl] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [hostIP, sethostIP] = useState('localhost');

  function startStream() {
    // Replace with the IP address of the host system

    setStreamUrl(`${hostIP}:8001/RecordingController/video_feeder`);
  }

  function pauseStream() {
    setStreamUrl("");
  }

  
  const handleOpenDialog = () => {
    hostIP === '' ? sethostIP(hostIP) : sethostIP(hostIP);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handlehostIPChange = (event) => {
    sethostIP(event.target.value);
  };

  const handleSavehostIP = () => {
    console.log("IP Address saved:", hostIP);
    // ensure it's in the right format: https://X.X.X.X
    
    sethostIP(hostIP);
    handleCloseDialog();
    // Here you can add the logic to use the IP address in your application
  };


  const handleButtonPress = async (url) => {
    try {
      const response = await fetch(url);
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };


  async function handleMove(direction) {
    try {
      let response = await fetch(
        `${hostIP}:8001/move_stage/${direction}`
      );
      let data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error moving stage:", error);
    }
  }

  
  const handleSliderChange = async (event) => {
    setSliderValue(event.target.value);

    const url = `${hostIP}:8001/LaserController/setLaserValue?laserName=488%20Laser&value=${event.target.value}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
    } catch (error) {
      console.error('There has been a problem with your fetch operation: ', error);
    }
  };

  const handleCheckboxChange = async (event) => {
    setIsChecked(event.target.checked);

    const activeStatus = event.target.checked ? 'true' : 'false';
    const url = `${hostIP}:8001/LaserController/setLaserActive?laserName=488%20Laser&active=${activeStatus}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
    } catch (error) {
      console.error('There has been a problem with your fetch operation: ', error);
    }
  };


  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AppBar position="fixed">
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
          <Avatar alt="UC2" src="/path_to_your_logo.png" />
        </Toolbar>
      </AppBar>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <List>
          {[
            "My Collection",
            "Connections",
            "Devices",
            "Workflows",
            "Remote Demo",
            "Notifications",
          ].map((text) => (
            <ListItem button onClick={() => text === "Connections" && handleOpenDialog()}>
              <Typography variant="h6" fontWeight="bold">
                {text}
              </Typography>
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Container component="main" sx={{ flexGrow: 1, p: 3, pt: 10 }}>
        <Typography variant="h6" gutterBottom>
          Video Display
        </Typography>
        <img style={{width: "100%", height: "auto"}} autoPlay src={streamUrl} ref={videoRef}></img>
        <Box mb={5}>
          <Typography variant="h6" gutterBottom>
            Stream Control
          </Typography>
          <Button onClick={startStream}>
            <PlayArrow />
          </Button>
          <Button onClick={pauseStream}>
            <Stop />
          </Button>
        </Box>

        <Box mt={5} mb={5}>
          <Typography variant="h6" gutterBottom>
            XYZ Controls
          </Typography>
        </Box>
        <Box mb={5}>
            <XYZControls onButtonPress={handleButtonPress} hostIP={hostIP} />
        </Box>
        <Box mb={5}>
          <Typography variant="h6" gutterBottom>
            Illumination
          </Typography>
          <div>
          <Slider defaultValue={30} aria-labelledby="continuous-slider" />
          <input type="range" min="0" max="1023" value={sliderValue} onChange={handleSliderChange} />
          <input type="checkbox" checked={isChecked} onChange={handleCheckboxChange} />
        </div>
        </Box>
      </Container>

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
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSavehostIP}>Save</Button>
          </DialogActions>
        </Dialog>
        
      <Box component="footer" p={2} mt={5} bgcolor="background.paper">
        <Typography variant="h6" align="center" fontWeight="bold">
          Your Footer Text Here
        </Typography>
      </Box>
    </ThemeProvider>


  );
}

/*
  return (
    <Container maxWidth="">
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6">
            Microscope Control
          </Typography>
        </Toolbar>
      </AppBar>

      <Box mt={5} mb={5}>
        <Typography variant="h6" gutterBottom>
          Video Display
        </Typography>
        <video ref={videoRef} width={320} height={240} autoPlay controls></video>
      </Box>

      <ButtonGroup variant="contained" color="primary" aria-label="image acquisition buttons">
        <Button onClick={startStream}>Start</Button>
      </ButtonGroup>

      <Box mb={5}>
        <Typography variant="h6" gutterBottom>
          XYZ Controls
        </Typography>
        <ButtonGroup variant="contained" color="primary" aria-label="XYZ control buttons">
          {['X+', 'X-', 'Y+', 'Y-', 'Z+', 'Z-'].map(direction => (
            <Button key={direction} onClick={() => handleMove(direction)}>
              {direction}
            </Button>
          ))}
        </ButtonGroup>
      </Box>
    </Container>
  );
}
*/

export default App;

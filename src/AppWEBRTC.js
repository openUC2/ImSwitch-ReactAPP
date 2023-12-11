import React, { useRef, useState } from 'react';
import { Button, ButtonGroup, Slider, Container, Box, Typography, AppBar, Toolbar, IconButton, Drawer, List, ListItem, CssBaseline, Grid, Avatar } from '@mui/material';
import { Menu as MenuIcon, PhotoCamera, FiberManualRecord } from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import XYZControls from './XYZControls';  // Assuming XYZControls is in the same directory

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
  typography: {
    fontFamily: 'Roboto',
    fontWeightBold: 700,
  },
});


function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const videoRef = useRef(null);
  const [streamUrl, setStreamUrl] = useState('');

  function startStream() {
    // Replace with the IP address of the host system
    const hostIP = '192.168.2.223';
    setStreamUrl(`http://${hostIP}:8001/RecordingController/video_feeder`);
  }

  function pauseStream() {
    setStreamUrl('');
  }


  async function startStream() {
    const pc = createPeerConnection();

    // Request an offer from the server
    const response = await fetch('http://${hostIP}:8001/request-offer', { method: 'POST' });
    const offer = await response.json();
    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    const data = {
      sdp: answer.sdp,
      type: answer.type
    };

    await fetch('http://${hostIP}:8001/answer', {
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST'
    });
  }

  function createPeerConnection() {
    const config = {
      sdpSemantics: 'unified-plan'
    };

    const pc = new RTCPeerConnection(config);

    pc.ontrack = (event) => {
      if (event.track.kind === 'video') {
        videoRef.current.srcObject = event.streams[0];
      }
    };

    return pc;
  }

  async function handleMove(direction) {
    try {
      let response = await fetch(`http://${hostIP}:8001/move_stage/${direction}`);
      let data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error moving stage:", error);
    }
  }
  
  return (
    <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <AppBar position="fixed">
                <Toolbar>
                    <IconButton edge="start" color="inherit" aria-label="menu" onClick={() => setDrawerOpen(!drawerOpen)}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                        Microscope Control
                    </Typography>
                    <Avatar alt="UC2" src="/path_to_your_logo.png" />
                </Toolbar>
            </AppBar>
            <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <List>
                    {['My Collection', 'Connections', 'Devices', 'Workflows', 'Remote Demo', 'Notifications'].map((text) => (
                        <ListItem button key={text}>
                            <Typography variant="h6" fontWeight="bold">{text}</Typography>
                        </ListItem>
                    ))}
                </List>
            </Drawer>        <Container component="main" sx={{ flexGrow: 1, p: 3, pt: 10 }}>
            <Typography variant="h6" gutterBottom>
                Video Display
            </Typography>
            <video width={640} height={480} autoPlay ref={videoRef}></video>
            <Box mb={5}>
                <Typography variant="h6" gutterBottom>
                    Recording
                </Typography>
                <ButtonGroup variant="contained" color="primary" aria-label="Recording control buttons">
                    <Button onClick={startStream}><PhotoCamera /></Button>
                    <Button><FiberManualRecord /></Button>
                </ButtonGroup>
            </Box>

            <Box mt={5} mb={5}>
                <Typography variant="h6" gutterBottom>
                    XYZ Controls
                </Typography>
            </Box>
            <Box mb={5}>
                <XYZControls />
              </Box>          
            <Box mb={5}>
                <Typography variant="h6" gutterBottom>
                    Illumination
                </Typography>
                <Slider defaultValue={30} aria-labelledby="continuous-slider" />
            </Box>

        </Container>
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

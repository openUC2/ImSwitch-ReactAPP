import React, { useRef } from 'react';
import {
  Button, ButtonGroup, Slider, Container, Box, Typography, AppBar, Toolbar, IconButton
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';

function App() {
  const videoRef = useRef(null);

  async function startStream() {
    const pc = createPeerConnection();

    // Request an offer from the server
    const response = await fetch('http://localhost:8080/request-offer', { method: 'POST' });
    const offer = await response.json();
    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    const data = {
      sdp: answer.sdp,
      type: answer.type
    };

    await fetch('http://localhost:8080/answer', {
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
      let response = await fetch(`http://localhost:8080/move_stage/${direction}`);
      let data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error moving stage:", error);
    }
  }

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
        {/*... other buttons ...*/}
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

      {/*... other components ...*/}
    </Container>
  );
}

export default App;

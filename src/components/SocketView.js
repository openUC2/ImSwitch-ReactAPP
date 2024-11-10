import React, { useState, useEffect } from "react";
import {
  Paper,
  Tabs,
  Tab,
  Box,
  Typography,
  Button,
  Grid,
} from "@mui/material";
import { useWebSocket } from "../context/WebSocketContext";

const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
};

const SocketView = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [messages, setMessages] = useState([]);
  const socket = useWebSocket();

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        setMessages((prevMessages) => [...prevMessages, event.data]);
      };
    }

    return () => {
      if (socket) {
        socket.onmessage = null;
      }
    };
  }, [socket]);

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <Paper>
      <Tabs value={tabIndex} onChange={handleTabChange} aria-label="socket view tabs">
        <Tab label="Socket Messages" />
      </Tabs>

      <TabPanel value={tabIndex} index={0}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6">WebSocket Messages</Typography>
            <div>
              {messages.length > 0 ? (
                messages.map((message, index) => (
                  <Typography key={index} variant="body2" color="textSecondary">
                    {message}
                  </Typography>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No messages received yet.
                </Typography>
              )}
            </div>
            <div style={{ marginTop: "20px" }}>
              <Button
                variant="contained"
                color="secondary"
                onClick={clearMessages}
              >
                Clear Messages
              </Button>
            </div>
          </Grid>
        </Grid>
      </TabPanel>
    </Paper>
  );
};

export default SocketView;

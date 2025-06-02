import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Paper, Tabs, Tab, Box, Typography, Button, Grid } from "@mui/material";
import * as widgetSlice from "../state/slices/WidgetSlice.js";



const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={2}>{children}</Box>}
    </div>
  );
};

const LiveViewController = ({ hostIP, hostPort, WindowTitle }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [streamUrl, setStreamUrl] = useState(""); // State for live stream URL
  const videoRef = useRef(null);

  // Redux dispatcher and state
  const dispatch = useDispatch();
  const widgetState = useSelector(widgetSlice.getWidgetState);

  useEffect(() => {
    // Simulate setting the stream URL (replace with actual logic to fetch stream URL)
    const fetchStreamUrl = () => {
      // Here you could dynamically fetch or construct the live stream URL
      setStreamUrl(`${hostIP}:${hostPort}/RecordingController/video_feeder`);
    };

    fetchStreamUrl();
  }, [hostIP, hostPort]);

  return (
    <Paper>
      <Typography variant="h6" gutterBottom>
        Video Display 
      </Typography>
      {streamUrl ? (
        <img
          style={{ width: "100%", height: "auto" }}
          src={streamUrl}
          ref={videoRef}
          alt="Live Stream"
        />
      ) : (
        <Typography variant="body1" color="textSecondary">
          No stream available
        </Typography>
      )}
    </Paper>
  );
};

export default LiveViewController;

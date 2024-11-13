import React, { useState, useEffect } from 'react';
import { Paper, Tabs, Tab, Box, Typography, TextField, Button, Grid } from '@mui/material';
import { green, red } from '@mui/material/colors';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ITKVTKViewer from 'itk-vtk-viewer'; // assuming an external viewer integration

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
      {value === index && (
        <Box p={3}>
          {children}
        </Box>
      )}
    </div>
  );
}

const LightsheetController = ({ hostIP, hostPort }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [minPos, setMinPos] = useState(0);
  const [maxPos, setMaxPos] = useState(1000);
  const [speed, setSpeed] = useState(1000);
  const [axis, setAxis] = useState('A');
  const [illuSource, setIlluSource] = useState(-1);
  const [illuValue, setIlluValue] = useState(512);
  const [latestImagePath, setLatestImagePath] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const fetchLatestImagePath = async () => {
      try {
        const response = await fetch(`${hostIP}:${hostPort}/LightsheetController/returnLastLightsheetStackPath`);
        const data = await response.json();
        setLatestImagePath(data);
      } catch (error) {
        console.error('Error fetching latest image path:', error);
      }
    };

    fetchLatestImagePath();
  }, [hostIP, hostPort, isRunning]);

  const startScanning = () => {
    const url = `${hostIP}:${hostPort}/LightsheetController/performScanningRecording?minPos=${minPos}&maxPos=${maxPos}&speed=${speed}&axis=${axis}&illusource=${illuSource}&illuvalue=${illuValue}`;
    
    fetch(url, { method: 'GET' })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        setIsRunning(true);
      })
      .catch(error => console.error('Error:', error));
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <Paper>
      <Tabs value={tabIndex} onChange={handleTabChange} aria-label="Lightsheet Controller Tabs">
        <Tab label="Scanning Parameters" />
        <Tab label="View Latest Stack" />
      </Tabs>

      <TabPanel value={tabIndex} index={0}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Min Position"
              value={minPos}
              onChange={(e) => setMinPos(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Max Position"
              value={maxPos}
              onChange={(e) => setMaxPos(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Speed"
              value={speed}
              onChange={(e) => setSpeed(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Axis"
              value={axis}
              onChange={(e) => setAxis(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Illumination Source"
              value={illuSource}
              onChange={(e) => setIlluSource(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Illumination Value"
              value={illuValue}
              onChange={(e) => setIlluValue(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={startScanning}
              disabled={isRunning}
            >
              Start Scanning
            </Button>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabIndex} index={1}>
        {latestImagePath ? (
          <ITKVTKViewer file={latestImagePath} />
        ) : (
          <Typography variant="h6" color="textSecondary">No Image Stack Available</Typography>
        )}
      </TabPanel>
    </Paper>
  );
};

export default LightsheetController;

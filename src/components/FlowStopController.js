import React, { useState } from 'react';
import { Paper, Tabs, Tab, Box, Typography, TextField, Button, Slider, Switch } from '@mui/material';

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

const FlowStopController = ({hostIP, WindowTitle}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [timeStamp, setTimeStamp] = useState('0');
  const [experimentName, setExperimentName] = useState('Test');
  const [experimentDescription, setExperimentDescription] = useState('Some description');
  const [uniqueId, setUniqueId] = useState('1'); // Assuming you have a way to set this
  const [numImages, setNumImages] = useState('10');
  const [volumePerImage, setVolumePerImage] = useState('1000');
  const [timeToStabilize, setTimeToStabilize] = useState('0.5');


  const startExperiment = () => {
    const url = `${hostIP}:8001/FlowStopController/startFlowStopExperiment?timeStamp=${timeStamp}&experimentName=${experimentName}&experimentDescription=${experimentDescription}&uniqueId=${uniqueId}&numImages=${numImages}&volumePerImage=${volumePerImage}&timeToStabilize=${timeToStabilize}`;

    // Sending the HTTP request
    fetch(url, { method: 'GET' }) // Add more configurations if needed
      .then(response => response.json())
      .then(data => console.log(data))
      .catch(error => console.error('Error:', error));
  };

  const stopExperiment = () => {
    const url = `${hostIP}:8001/FlowStopController/stopFlowStopExperiment`;

    // Sending the HTTP request
    fetch(url, { method: 'GET' }) // Add more configurations if needed
      .then(response => response.json())
      .then(data => console.log(data))
      .catch(error => console.error('Error:', error));
  };



  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <Paper>
      <Tabs value={tabIndex} onChange={handleTabChange} aria-label="acquisition settings tabs">
      <Tab label="Automatic Settings" />
      <Tab label="Manual Acquisition Settings" />  
      </Tabs>

      <TabPanel value={tabIndex} index={1}>
        {/* Manual Acquisition Settings */}
        <Typography>Focus</Typography>
        <Slider defaultValue={30} />
        <Typography>Pump Speed</Typography>
        <Slider defaultValue={30} />
        <Button variant="contained">Snap</Button>
        <TextField label="Exposure Time" defaultValue="0.1" />
        <TextField label="Gain" defaultValue="0" />
        {/* Add more fields and layout as per your design */}
      </TabPanel>

      <TabPanel value={tabIndex} index={0}>
      <TextField style={{ marginBottom: '20px' }} label="Time Stamp Name" defaultValue="0" onChange={(e) => setTimeStamp(e.target.value)} />
      <TextField style={{ marginBottom: '20px' }} label="Experiment Name" defaultValue="Test" onChange={(e) => setExperimentName(e.target.value)} />
      <TextField style={{ marginBottom: '20px' }} label="Experiment Description" defaultValue="Some description" onChange={(e) => setExperimentDescription(e.target.value)} />
      <TextField style={{ marginBottom: '20px' }} label="Volume Per Image" defaultValue="1000" onChange={(e) => setVolumePerImage(e.target.value)} />
      <TextField style={{ marginBottom: '20px' }} label="Time to stabilize" defaultValue="0.5" onChange={(e) => setTimeToStabilize(e.target.value)} />
      <TextField style={{ marginBottom: '20px' }} label="Number of Images" defaultValue="10" onChange={(e) => setNumImages(e.target.value)} />
      <div>
        <Button style={{ marginBottom: '20px' }} variant="contained" onClick={startExperiment}>Start</Button>
        <Button style={{ marginBottom: '20px' }} variant="contained" onClick={stopExperiment}>Stop</Button>
      </div>
    </TabPanel>
        </Paper>
  );
};

export default FlowStopController;

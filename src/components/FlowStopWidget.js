import React, { useState, useEffect } from 'react';
import { Button, TextField, Grid } from '@mui/material';

const FlowStopWidget = ({ hostIP, hostPort }) => {
  const [timeStamp, setTimeStamp] = useState(new Date().toISOString());
  const [experimentName, setExperimentName] = useState("FlowStop");
  const [experimentDescription, setExperimentDescription] = useState("Description");
  const [uniqueId, setUniqueId] = useState(Math.floor(Math.random() * 1000000).toString());
  const [numImages, setNumImages] = useState(-1);
  const [volumePerImage, setVolumePerImage] = useState(1000);
  const [timeToStabilize, setTimeToStabilize] = useState(0.5);
  const [delayToStart, setDelayToStart] = useState(1);
  const [frameRate, setFrameRate] = useState(1);
  const [filePath, setFilePath] = useState("./");
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${hostIP}:${hostPort}/FlowStopController/getStatus`);
        const data = await response.json();
        // print the data to the console
        
        setIsRunning(data[0]);
      } catch (error) {
        console.error('Error fetching status:', error);
      }
    };

    const fetchExperimentParameters = async () => {
      try {
        const url = `${hostIP}:${hostPort}/FlowStopController/getExperimentParameters`;
        const response = await fetch(url);
        const data = await response.json();
        setTimeStamp(data.timeStamp);
        setExperimentName(data.experimentName);
        setExperimentDescription(data.experimentDescription);
        setUniqueId(data.uniqueId);
        setNumImages(parseInt(data.numImages, 10));
        setVolumePerImage(parseFloat(data.volumePerImage));
        setTimeToStabilize(parseFloat(data.timeToStabilize));
        setDelayToStart(parseFloat(data.delayToStart));
        setFrameRate(parseFloat(data.frameRate));
        setFilePath(data.filePath);
      } catch (error) {
        console.error('Error fetching experiment parameters:', error);
      }
    };

    fetchStatus();
    fetchExperimentParameters();
  }, [hostIP, hostPort]);

  const handleStart = () => {
    const url = `${hostIP}:${hostPort}/FlowStopController/startFlowStopExperiment?timeStamp=${timeStamp}&experimentName=${experimentName}&experimentDescription=${experimentDescription}&uniqueId=${uniqueId}&numImages=${numImages}&volumePerImage=${volumePerImage}&timeToStabilize=${timeToStabilize}&delayToStart=${delayToStart}&frameRate=${frameRate}&filePath=${encodeURIComponent(filePath)}`;
    fetch(url)
      .then(response => response.json())
      .then(data => {
        console.log(data);
        setIsRunning(true);
      })
      .catch(error => console.error('Error:', error));
  };

  const handleStop = () => {
    const url = `${hostIP}:${hostPort}/FlowStopController/stopFlowStopExperiment?timeStamp=${timeStamp}&experimentName=${experimentName}&experimentDescription=${experimentDescription}&uniqueId=${uniqueId}&numImages=${numImages}&volumePerImage=${volumePerImage}&timeToStabilize=${timeToStabilize}&delayToStart=${delayToStart}&frameRate=${frameRate}&filePath=${encodeURIComponent(filePath)}`;
    fetch(url)
      .then(response => response.json())
      .then(data => {
        console.log(data);
        setIsRunning(false);
      })
      .catch(error => console.error('Error:', error));
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          label="Timestamp"
          value={timeStamp}
          onChange={(e) => setTimeStamp(e.target.value)}
          fullWidth
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Experiment Name"
          value={experimentName}
          onChange={(e) => setExperimentName(e.target.value)}
          fullWidth
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Experiment Description"
          value={experimentDescription}
          onChange={(e) => setExperimentDescription(e.target.value)}
          fullWidth
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Unique ID"
          value={uniqueId}
          onChange={(e) => setUniqueId(e.target.value)}
          fullWidth
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Number of Images"
          type="number"
          value={numImages}
          onChange={(e) => setNumImages(parseInt(e.target.value, 10))}
          fullWidth
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Volume per Image"
          type="number"
          value={volumePerImage}
          onChange={(e) => setVolumePerImage(parseFloat(e.target.value))}
          fullWidth
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Time to Stabilize (s)"
          type="number"
          value={timeToStabilize}
          onChange={(e) => setTimeToStabilize(parseFloat(e.target.value))}
          fullWidth
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Delay to Start (s)"
          type="number"
          value={delayToStart}
          onChange={(e) => setDelayToStart(parseFloat(e.target.value))}
          fullWidth
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Frame Rate"
          type="number"
          value={frameRate}
          onChange={(e) => setFrameRate(parseFloat(e.target.value))}
          fullWidth
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="File Path"
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          fullWidth
        />
      </Grid>
      <Grid item xs={12}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleStart}
          disabled={isRunning}
        >
          Start
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleStop}
          disabled={!isRunning}
        >
          Stop
        </Button>
      </Grid>
    </Grid>
  );
};

export default FlowStopWidget;

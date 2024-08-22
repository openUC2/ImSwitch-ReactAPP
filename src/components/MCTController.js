import React, { useState } from 'react';
import { Paper, Grid, TextField, Checkbox, FormControlLabel, Slider, Button, Typography } from '@mui/material';

const MCTController = ({ hostIP, hostPort }) => {
  const [timePeriod, setTimePeriod] = useState('5');
  const [numMeasurements, setNumMeasurements] = useState('1');
  const [zMin, setZMin] = useState('-100');
  const [zMax, setZMax] = useState('100');
  const [zSteps, setZSteps] = useState('0');
  const [xMin, setXMin] = useState('-1000');
  const [xMax, setXMax] = useState('1000');
  const [xSteps, setXSteps] = useState('0');
  const [yMin, setYMin] = useState('-1000');
  const [yMax, setYMax] = useState('1000');
  const [ySteps, setYSteps] = useState('0');
  const [intensityLaser1, setIntensityLaser1] = useState(0);
  const [intensityLaser2, setIntensityLaser2] = useState(0);
  const [intensityLED, setIntensityLED] = useState(0);
  const [fileName, setFileName] = useState('MCT');
  const [isRunning, setIsRunning] = useState(false);

  const handleStart = () => {
    const url = `${hostIP}:${hostPort}/start`;
    fetch(url, { method: 'GET' })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        setIsRunning(true);
      })
      .catch(error => console.error('Error:', error));
  };

  const handleStop = () => {
    const url = `${hostIP}:${hostPort}/stop`;
    fetch(url, { method: 'GET' })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        setIsRunning(false);
      })
      .catch(error => console.error('Error:', error));
  };

  return (
    <Paper style={{ padding: '20px' }}>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            label="Period T (s)"
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="N Measurements"
            value={numMeasurements}
            onChange={(e) => setNumMeasurements(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Z-Stack Min"
            value={zMin}
            onChange={(e) => setZMin(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Z-Stack Max"
            value={zMax}
            onChange={(e) => setZMax(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Z-Stack Steps"
            value={zSteps}
            onChange={(e) => setZSteps(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="X Scan Min"
            value={xMin}
            onChange={(e) => setXMin(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="X Scan Max"
            value={xMax}
            onChange={(e) => setXMax(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="X Scan Steps"
            value={xSteps}
            onChange={(e) => setXSteps(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Y Scan Min"
            value={yMin}
            onChange={(e) => setYMin(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Y Scan Max"
            value={yMax}
            onChange={(e) => setYMax(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Y Scan Steps"
            value={ySteps}
            onChange={(e) => setYSteps(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <Typography>Intensity (Laser 1): {intensityLaser1}</Typography>
          <Slider
            value={intensityLaser1}
            onChange={(e, value) => setIntensityLaser1(value)}
            max={32767}
            step={1}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography>Intensity (Laser 2): {intensityLaser2}</Typography>
          <Slider
            value={intensityLaser2}
            onChange={(e, value) => setIntensityLaser2(value)}
            max={32767}
            step={1}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography>Intensity (LED): {intensityLED}</Typography>
          <Slider
            value={intensityLED}
            onChange={(e, value) => setIntensityLED(value)}
            max={255}
            step={1}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="File Name"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <Button variant="contained" color="primary" onClick={handleStart} disabled={isRunning}>
            Start
          </Button>
          <Button variant="contained" color="secondary" onClick={handleStop} disabled={!isRunning} style={{ marginLeft: '10px' }}>
            Stop
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default MCTController;

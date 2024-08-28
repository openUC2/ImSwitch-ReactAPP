import React, { useState, useEffect } from 'react';
import { Paper, Grid, TextField, Checkbox, FormControlLabel, Button, Typography, Slider, Select, MenuItem } from '@mui/material';

const HistoScanController = ({ hostIP, hostPort }) => {
  const [illuminationSource, setIlluminationSource] = useState('Laser 1');
  const [illuminationValue, setIlluminationValue] = useState(128);
  const [stepSizeX, setStepSizeX] = useState('300');
  const [stepSizeY, setStepSizeY] = useState('300');
  const [path, setPath] = useState('Default Path');
  const [timeInterval, setTimeInterval] = useState('');
  const [numberOfScans, setNumberOfScans] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [scanStatus, setScanStatus] = useState(false); // For scan status visualization
  const [isStitchAshlar, setIsStitchAshlar] = useState(false);
  const [isStitchAshlarFlipX, setIsStitchAshlarFlipX] = useState(false);
  const [isStitchAshlarFlipY, setIsStitchAshlarFlipY] = useState(false);
  const [resizeFactor, setResizeFactor] = useState(1);
  const [initPosX, setInitPosX] = useState('');
  const [initPosY, setInitPosY] = useState('');



  const handleStart = () => {
    // Set default values if inputs are empty
    const nTimesValue = numberOfScans || 1;
    const tPeriodValue = timeInterval || 1;
    const mInitPosX = initPosX || 0;  
    const mInitPosY = initPosY || 0;

    const url = `${hostIP}:${hostPort}/HistoScanController/startHistoScanTileBasedByParameters?` +
      `numberTilesX=2&numberTilesY=2&stepSizeX=${stepSizeX}&stepSizeY=${stepSizeY}&` +
      `nTimes=${nTimesValue}&tPeriod=${tPeriodValue}&` +
      `initPosX=${mInitPosX}&initPosY=${mInitPosY}&isStitchAshlar=${isStitchAshlar}&` +
      `isStitchAshlarFlipX=${isStitchAshlarFlipX}&isStitchAshlarFlipY=${isStitchAshlarFlipY}&resizeFactor=${resizeFactor}`;


    fetch(url, { method: 'GET' })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        setIsRunning(true);
      })
      .catch(error => console.error('Error:', error));
  };

  const handleStop = () => {
    const url = `${hostIP}:${hostPort}/HistoScanController/stopHistoScan`;
    fetch(url, { method: 'GET' })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        setIsRunning(false);
      })
      .catch(error => console.error('Error:', error));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const url = `${hostIP}:${hostPort}/HistoScanController/getStatusScanRunning`;
      fetch(url, { method: 'GET' })
        .then(response => response.json())
        .then(data => {
          setScanStatus(data.isRunning); // Assume the API returns { isRunning: true/false }
        })
        .catch(error => console.error('Error:', error));
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [hostIP, hostPort]);

  return (
    <Paper style={{ padding: '20px' }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6">HistoScan Controller</Typography>
        </Grid>

        {/* Illumination Source Selector */}
        <Grid item xs={6}>
          <Typography>Illumination Source:</Typography>
          <Select
            value={illuminationSource}
            onChange={(e) => setIlluminationSource(e.target.value)}
            fullWidth
          >
            <MenuItem value="Laser 1">Laser 1</MenuItem>
            <MenuItem value="Laser 2">Laser 2</MenuItem>
            <MenuItem value="LED">LED</MenuItem>
          </Select>
        </Grid>

        {/* Illumination Value Slider */}
        <Grid item xs={6}>
          <Typography>Illumination Value: {illuminationValue}</Typography>
          <Slider
            value={illuminationValue}
            onChange={(e, value) => setIlluminationValue(value)}
            max={255}
            step={1}
          />
        </Grid>

        {/* Position and other parameters */}
        <Grid item xs={6}>
          <TextField
            label="Step Size X"
            value={stepSizeX}
            onChange={(e) => setStepSizeX(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Step Size Y"
            value={stepSizeY}
            onChange={(e) => setStepSizeY(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Path"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Time Interval (s)"
            value={timeInterval}
            onChange={(e) => setTimeInterval(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Number of Scans"
            value={numberOfScans}
            onChange={(e) => setNumberOfScans(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={6}>
          <Checkbox
            checked={isStitchAshlar}
            onChange={(e) => setIsStitchAshlar(e.target.checked)}
          />
          <Typography>Stitch Ashlar</Typography>
        </Grid>
        <Grid item xs={6}>
          <Checkbox
            checked={isStitchAshlarFlipX}
            onChange={(e) => setIsStitchAshlarFlipX(e.target.checked)}
          />
          <Typography>Stitch Ashlar Flip X</Typography>
        </Grid>
        <Grid item xs={6}>
          <Checkbox
            checked={isStitchAshlarFlipY}
            onChange={(e) => setIsStitchAshlarFlipY(e.target.checked)}  
          />
          <Typography>Stitch Ashlar Flip Y</Typography>
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Resize Factor"
            value={resizeFactor}
            onChange={(e) => setResizeFactor(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Initial Position X"
            value={initPosX}
            onChange={(e) => setInitPosX(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Initial Position Y"
            value={initPosY}
            onChange={(e) => setInitPosY(e.target.value)}
            fullWidth
          />
        </Grid>
        




        {/* Start and Stop buttons */}
        <Grid item xs={6}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleStart}
            disabled={isRunning}
            fullWidth
          >
            Start
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleStop}
            disabled={!isRunning}
            fullWidth
          >
            Stop
          </Button>
        </Grid>

        {/* Scan status indicator */}
        <Grid item xs={12}>
          <Typography variant="body1" color={scanStatus ? 'green' : 'red'}>
            Scan Status: {scanStatus ? 'Running' : 'Stopped'}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default HistoScanController;

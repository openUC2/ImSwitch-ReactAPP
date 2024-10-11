import { Button, Grid, Dialog, DialogTitle, List, ListItem, ListItemText, TextField } from '@mui/material';
import React, { useState, useEffect } from "react";

const AxisControl = ({ axisLabel, onButtonPress, hostIP, hostPort }) => {
  const [steps, setSteps] = useState('1000');
  const [speedValue, setSpeed] = useState('10000');
  const [mPosition, setPosition] = useState(0);
  const [isStepsOpen, setStepsOpen] = useState(false);
  const [isSpeedOpen, setSpeedOpen] = useState(false);
  const [positionerNames, setPositionerNames] = useState([]);

  const dialValues = [1, 5, 10, 50, 100, 500, 1000, 10000, 20000, 100000];

  const getPositionerNames = async () => {
    try {
      const response = await fetch(`${hostIP}:${hostPort}/PositionerController/getPositionerNames`);
      const data = await response.json();
      console.log(data);
      setPositionerNames(data[0]);
    } catch (error) {
      console.error("Error fetching positioner names:", error);
    }
  };

  // Fetch positions from the server
  const fetchPositions = async () => {
    try {
      const response = await fetch(`${hostIP}:${hostPort}/PositionerController/getPositionerPositions`);
      const data = await response.json();
      
      // Update position for the specific axis
      const stageKeys = Object.keys(data);
      setPosition(data[stageKeys[0]][axisLabel]);
    } catch (error) {
      console.error("Error fetching positioner positions:", error);
    }
  };

  // Fetch the positioner names on load
  useEffect(() => {
    getPositionerNames();
  }, []);
  
  // Fetch the position on load
  useEffect(() => {
    fetchPositions();
  }, []);



  const handleIncrement = async () => {
    const url = `${hostIP}:${hostPort}/PositionerController/movePositioner?axis=${axisLabel}&dist=${Math.abs(steps)}&isAbsolute=false&isBlocking=false&speed=${speedValue}`;
    await onButtonPress(url);
    fetchPositions(); // Update position after button press
  };

  const handleDecrement = async () => {
    const negativeSteps = -Math.abs(steps);
    const url = `${hostIP}:${hostPort}/PositionerController/movePositioner?axis=${axisLabel}&dist=${negativeSteps}&isAbsolute=false&isBlocking=false&speed=${speedValue}`;
    await onButtonPress(url);
    fetchPositions(); // Update position after button press
  };

  const handleGoTo = async () => {
    const url = `${hostIP}:${hostPort}/PositionerController/movePositioner?axis=${axisLabel}&dist=${mPosition}&isAbsolute=true&isBlocking=false&speed=${speedValue}`;
    await onButtonPress(url);
    fetchPositions(); // Update position after button press
  };

  const handleStop = async () => {
    const url = `${hostIP}:${hostPort}/PositionerController/stopAxis?axis=${axisLabel}`;
    await onButtonPress(url);
    fetchPositions(); // Update position after button press
  };

  const handleForever = async () => {
    const url = `${hostIP}:${hostPort}/PositionerController/movePositionerForever?axis=${axisLabel}&speed=${speedValue}&is_stop=false`;
    await onButtonPress(url);
    fetchPositions(); // Update position after button press
  };

  const handleDialSelect = (value, type) => {
    if (type === 'steps') {
      setSteps(value.toString());
      setStepsOpen(false);
    } else if (type === 'speed') {
      setSpeed(value.toString());
      setSpeedOpen(false);
    }
  };

  const handleHomeAxis = async () => {
    //https://localhost:8001/PositionerController/homeAxis?axis=X&isBlocking=false
    const url = `${hostIP}:${hostPort}/PositionerController/homeAxis?axis=${axisLabel}&isBlocking=false`;
    await onButtonPress(url);
    fetchPositions(); // Update position after button press
  }

  return (
    <Grid container spacing={1} direction="column" alignItems="center">
      <Grid item xs={12}>
        <h2>{axisLabel} Axis</h2>
      </Grid>
      
      <Grid container item spacing={1} alignItems="center" xs={12}>
        <Grid item>
          <Button onClick={handleIncrement} variant="contained" color="primary">+</Button>
        </Grid>
        <Grid item>
          <Button onClick={() => setStepsOpen(true)} variant="outlined" color="primary">Steps: {steps}</Button>
        </Grid>
        <Grid item>
          <Button onClick={handleDecrement} variant="contained" color="primary">-</Button>
        </Grid>
      </Grid>
      <Grid container item spacing={1} alignItems="center" xs={12}>
        <Grid item>
          <TextField
            label="Position"
            variant="outlined"
            value={mPosition}
            onChange={(e) => setPosition(e.target.value)}
          />
          <Button onClick={handleGoTo} variant="contained" color="primary">Go To</Button>
        </Grid>
        <Grid item>
          <Button onClick={() => setSpeedOpen(true)} variant="outlined" color="primary">Speed: {speedValue}</Button>
        </Grid>
        <Grid item>
          <Button onClick={handleStop} variant="contained" color="secondary">Stop</Button>
        </Grid>
        <Grid item>
          <Button onClick={handleForever} variant="contained" color="secondary">Forever</Button>
        </Grid>        
      </Grid>

      {/* Dialog for Steps */}
      <Dialog open={isStepsOpen} onClose={() => setStepsOpen(false)}>
        <DialogTitle>Select Steps</DialogTitle>
        <List>
          {dialValues.map((value) => (
            <ListItem button onClick={() => handleDialSelect(value, 'steps')} key={value}>
              <ListItemText primary={value} />
            </ListItem>
          ))}
        </List>
      </Dialog>

      {/* Dialog for Speed */}
      <Dialog open={isSpeedOpen} onClose={() => setSpeedOpen(false)}>
        <DialogTitle>Select Speed</DialogTitle>
        <List>
          {dialValues.map((value) => (
            <ListItem button onClick={() => handleDialSelect(value, 'speed')} key={value}>
              <ListItemText primary={value} />
            </ListItem>
          ))}
        </List>
      </Dialog>
      {/* Home Axis Button */}
      <Grid item>
        <Button onClick={handleHomeAxis} variant="contained" color="primary">Home Axis</Button>
      </Grid>
    </Grid>
  );
};

export default AxisControl;

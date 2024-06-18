
import { Button, TextField, Grid, Slider } from '@mui/material';
import React, { useRef, useEffect, useState } from "react";


const AxisControl = ({ axisLabel, onButtonPress, hostIP, hostPort }) => {
  // State for the slider value
  const [sliderValue, setSliderValue] = useState(0);
  const [steps, setSteps] = useState('1000');
  const [absPosition, setAbsPosition] = useState('0');
  const [speedValue, setSpeed] = useState('1000');


  const handleIncrement = (steps, speedValue) => {
    const url = `${hostIP}:${hostPort}/PositionerController/movePositioner?axis=${axisLabel}&dist=${steps}&isAbsolute=false&isBlocking=false&speed=${speedValue}`
    onButtonPress(url);
  };

  const handleDecrement = (steps, speedValue) => {
    steps = -steps;
    const url = `${hostIP}:${hostPort}/PositionerController/movePositioner?axis=${axisLabel}&dist=${steps}&isAbsolute=false&isBlocking=false&speed=${speedValue}`
    onButtonPress(url);
  }

  const handleAbsPositionChange = (event) => {
    setAbsPosition(event.target.value);
  };

  // Handle slider value change
  const handleSliderChange = (event, newValue) => {
    setSliderValue(newValue);
  };

  const handleStepsChange = (event) => {
    setSteps(event.target.value);
  };

  const handleSpeedChange = (event) =>{
    setSpeed(event.target.value)
  }

  // Handle slider commit action
  const handleSliderCommit = () => {
    const url = `${hostIP}:${hostPort}/PositionerController/movePositioner?axis=${axisLabel}&dist=${absPosition}&isAbsolute=true&isBlocking=false&speed=${sliderValue}`;
    onButtonPress(url);
  };

  const handleGoTo = () => {
    // This is just a placeholder. You'll need to modify this to use actual data if necessary.
    const url = `${hostIP}:${hostPort}/PositionerController/movePositioner?axis=${axisLabel}&dist=${absPosition}&isAbsolute=true&isBlocking=false&speed=10000`
    onButtonPress(url);
  };

  const handleStop = () => {
    // This is just a placeholder. You'll need to modify this to use actual data if necessary.
    const url = `${hostIP}:${hostPort}/PositionerController/movePositioner?axis=${axisLabel}&dist=slack0&isAbsolute=false&isBlocking=false&speed=0`;
    onButtonPress(url);
  };

  return (
    <Grid container spacing={1} direction="column" alignItems="center">
      <Grid item xs={12}>
        <h2>{axisLabel} Axis</h2>
      </Grid>
      <Grid container item spacing={1} alignItems="center" xs={12}>
        <Grid item>
        <Button onClick={() => handleIncrement(steps, speedValue)} variant="contained" color="primary">+</Button>
        </Grid>
        <Grid item>
          <TextField label="Steps" variant="outlined" size="small" value={steps} onChange={handleStepsChange} />
        </Grid>
        <Grid item>
        <Button onClick={() => handleDecrement(steps, speedValue)} variant="contained" color="primary">-</Button>
        </Grid>
      </Grid>
      <Grid container item spacing={1} alignItems="center" xs={12}>
        <Grid item>
          <Button onClick={handleGoTo} variant="contained" color="primary">Go To</Button>
        </Grid>
        <Grid item>
          <TextField label="Speed" variant="outlined" size="small" defaultValue="1000" onChange={handleSpeedChange}/>
        </Grid>
        <Grid item>
          <Button onClick={handleStop} variant="contained" color="secondary">Stop</Button>
        </Grid>
      </Grid>

      <Grid item xs={12} sx={{ maxWidth: 300, width: '100%' }}>
        <Grid item xs={12}>
          <Slider
            value={sliderValue}
            onChange={handleSliderChange}
            onChangeCommitted={handleSliderCommit}
            min={0}
            max={100} // Adjust min and max as needed
          />
        </Grid>
      </Grid>        
    </Grid>
  );
};

export default AxisControl;

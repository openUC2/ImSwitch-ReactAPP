
import { Button, TextField, Grid, Slider } from '@mui/material';
import React, { useRef, useEffect, useState } from "react";


const AxisControl = ({ axisLabel, onButtonPress, hostIP }) => {
  // State for the slider value
  const [sliderValue, setSliderValue] = useState(0);
  const [steps, setSteps] = useState('1000');
  const [absPosition, setAbsPosition] = useState('0');


  const handleIncrement = (steps) => {
    const url = `http://${hostIP}:8001/PositionerController/movePositioner?positionerName=ESP32Stage&axis=${axisLabel}&dist=${steps}&isAbsolute=false&isBlocking=false&speed=10000`
    onButtonPress(url);
  };

  const handleDecrement = (steps) => {
    steps = -steps;
    const url = `http://${hostIP}:8001/PositionerController/movePositioner?positionerName=ESP32Stage&axis=${axisLabel}&dist=${steps}&isAbsolute=false&isBlocking=false&speed=10000`
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

  // Handle slider commit action
  const handleSliderCommit = () => {
    const url = `http://${hostIP}:8001/PositionerController/movePositioner?positionerName=ESP32Stage&axis=${axisLabel}&dist=${absPosition}&isAbsolute=true&isBlocking=false&speed=${sliderValue}`;
    onButtonPress(url);
  };

  const handleGoTo = () => {
    // This is just a placeholder. You'll need to modify this to use actual data if necessary.
    const url = `http://${hostIP}:8001/PositionerController/movePositioner?positionerName=ESP32Stage&axis=${axisLabel}&dist=${absPosition}&isAbsolute=true&isBlocking=false&speed=10000`
    onButtonPress(url);
  };

  const handleStop = () => {
    // This is just a placeholder. You'll need to modify this to use actual data if necessary.
    const url = `http://${hostIP}:8001/stop/${axisLabel}`;
    onButtonPress(url);
  };

  return (
    <Grid container spacing={1} direction="column" alignItems="center">
      <Grid item xs={12}>
        <h2>{axisLabel} Axis</h2>
      </Grid>
      <Grid container item spacing={1} alignItems="center" xs={12}>
        <Grid item>
        <Button onClick={() => handleIncrement(steps)} variant="contained" color="primary">+</Button>
        </Grid>
        <Grid item>
          <TextField label="Steps" variant="outlined" size="small" value={steps} onChange={handleStepsChange} />
        </Grid>
        <Grid item>
        <Button onClick={() => handleDecrement(steps)} variant="contained" color="primary">-</Button>
        </Grid>
      </Grid>
      <Grid container item spacing={1} alignItems="center" xs={12}>
        <Grid item>
          <Button onClick={handleGoTo} variant="contained" color="primary">Go To</Button>
        </Grid>
        <Grid item>
          <TextField label="Speed" variant="outlined" size="small" defaultValue="1000" onChange={handleAbsPositionChange}/>
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

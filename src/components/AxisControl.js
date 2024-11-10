import {
  Button,
  Grid,
  Dialog,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  TextField,
} from "@mui/material";
import React, { useState } from "react";

const AxisControl = ({
  axisLabel,
  onButtonPress,
  hostIP,
  hostPort,
  positionerName,
  mPosition,
}) => {
  const [steps, setSteps] = useState("1000");
  const [speedValue, setSpeed] = useState("10000");
  const [isStepsOpen, setStepsOpen] = useState(false);
  const [isSpeedOpen, setSpeedOpen] = useState(false);
  const [targetPosition, setTargetPosition] = useState(0);

  const buttonWidth = { width: "100px" };

  const dialValues = [1, 5, 10, 50, 100, 500, 1000, 10000, 20000, 100000];

  const handleIncrement = async () => {
    const url = `${hostIP}:${hostPort}/PositionerController/movePositioner?positionerName=${positionerName}&axis=${axisLabel}&dist=${Math.abs(
      steps
    )}&isAbsolute=false&isBlocking=false&speed=${speedValue}`;
    await onButtonPress(url);
  };

  const handleDecrement = async () => {
    const negativeSteps = -Math.abs(steps);
    const url = `${hostIP}:${hostPort}/PositionerController/movePositioner?positionerName=${positionerName}&axis=${axisLabel}&dist=${negativeSteps}&isAbsolute=false&isBlocking=false&speed=${speedValue}`;
    await onButtonPress(url);
  };

  const handleGoTo = async () => {
    const url = `${hostIP}:${hostPort}/PositionerController/movePositioner?positionerName=${positionerName}&axis=${axisLabel}&dist=${targetPosition}&isAbsolute=true&isBlocking=false&speed=${speedValue}`;
    await onButtonPress(url);
  };

  const handleStop = async () => {
    const url = `${hostIP}:${hostPort}/PositionerController/stopAxis?positionerName=${positionerName}&axis=${axisLabel}`;
    await onButtonPress(url);
  };

  const handleForever = async () => {
    const url = `${hostIP}:${hostPort}/PositionerController/movePositionerForever?positionerName=${positionerName}&axis=${axisLabel}&speed=${speedValue}&is_stop=false`;
    await onButtonPress(url);
  };

  const handleDialSelect = (value, type) => {
    if (type === "steps") {
      setSteps(value.toString());
      setStepsOpen(false);
    } else if (type === "speed") {
      setSpeed(value.toString());
      setSpeedOpen(false);
    }
  };

  const handleHomeAxis = async () => {
    const url = `${hostIP}:${hostPort}/PositionerController/homeAxis?positionerName=${positionerName}&axis=${axisLabel}&isBlocking=false`;
    await onButtonPress(url);
  };
  return (
    <Grid container spacing={2} direction="column" alignItems="center">
      <Grid item xs={12}>
        <h2>{axisLabel} Axis</h2>
      </Grid>

      <Grid container item spacing={2} justifyContent="center" xs={12}>
        <Grid item>
          <TextField
            label="Position"
            variant="outlined"
            value={mPosition}
            style={buttonWidth}
            InputProps={{
              readOnly: true,
            }}
          />
        </Grid>
      </Grid>

      <Grid container item spacing={2} justifyContent="center" xs={12}>
        <Grid item>
          <Button
            onClick={handleIncrement}
            variant="contained"
            style={buttonWidth}
            color="primary"
          >
            +
          </Button>
        </Grid>
        <Grid item>
          <Button
            onClick={() => setStepsOpen(true)}
            variant="outlined"
            style={buttonWidth}
            color="primary"
          >
            Steps: {steps}
          </Button>
        </Grid>
        <Grid item>
          <Button
            onClick={handleDecrement}
            variant="contained"
            style={buttonWidth}
            color="primary"
          >
            -
          </Button>
        </Grid>
      </Grid>

      <Grid container item spacing={2} justifyContent="center" xs={12}>
        <Grid item>
          <TextField
            label="Position"
            variant="outlined"
            value={targetPosition}
            onChange={(e) => setTargetPosition(e.target.value)}
            style={{ width: buttonWidth }}
          />
        </Grid>
        <Grid item>
          <Button
            onClick={handleGoTo}
            variant="contained"
            style={buttonWidth}
            color="primary"
          >
            Go To
          </Button>
        </Grid>
      </Grid>

      <Grid container item spacing={2} justifyContent="center" xs={12}>
        <Grid item>
          <Button
            onClick={() => setSpeedOpen(true)}
            variant="outlined"
            style={buttonWidth}
            color="primary"
          >
            Speed: {speedValue}
          </Button>
        </Grid>
        <Grid item>
          <Button
            onClick={handleStop}
            variant="contained"
            style={buttonWidth}
            color="secondary"
          >
            Stop
          </Button>
        </Grid>
        <Grid item>
          <Button
            onClick={handleForever}
            variant="contained"
            style={buttonWidth}
            color="secondary"
          >
            Forever
          </Button>
        </Grid>
      </Grid>

      <Dialog open={isStepsOpen} onClose={() => setStepsOpen(false)}>
        <DialogTitle>Select Steps</DialogTitle>
        <List>
          {dialValues.map((value) => (
            <ListItem
              button
              onClick={() => handleDialSelect(value, "steps")}
              key={value}
            >
              <ListItemText primary={value} />
            </ListItem>
          ))}
        </List>
      </Dialog>

      <Dialog open={isSpeedOpen} onClose={() => setSpeedOpen(false)}>
        <DialogTitle>Select Speed</DialogTitle>
        <List>
          {dialValues.map((value) => (
            <ListItem
              button
              onClick={() => handleDialSelect(value, "speed")}
              key={value}
            >
              <ListItemText primary={value} />
            </ListItem>
          ))}
        </List>
      </Dialog>

      <Grid item>
        <Button
          onClick={handleHomeAxis}
          variant="contained"
          style={buttonWidth}
          color="primary"
        >
          Home Axis
        </Button>
      </Grid>
    </Grid>
  );
};

export default AxisControl;

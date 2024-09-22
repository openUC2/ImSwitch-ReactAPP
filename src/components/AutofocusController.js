import React, { useState } from "react";
import { Paper, Grid, TextField, Button } from "@mui/material";

const AutofocusController = ({ hostIP, hostPort }) => {
  const [rangeZ, setRangeZ] = useState(10); // Default range for z
  const [resolutionZ, setResolutionZ] = useState(1); // Default resolution for z
  const [defocusZ, setDefocusZ] = useState(0); // Default defocus for z
  const [isRunning, setIsRunning] = useState(false); // Autofocus state

  const handleStart = () => {
    const url = `${hostIP}:${hostPort}/AufofocusController/autoFocus?` +
      `rangez=${rangeZ}&resolutionz=${resolutionZ}&defocusz=${defocusZ}`;
        console.log("Autofocus started:", url);
    fetch(url, { method: "GET" })
      .then((response) => response.json())
      .then((data) => {
        console.log("Autofocus started:", data);
        setIsRunning(true);
      })
      .catch((error) => {
        console.error("Error starting autofocus:", error);
      });
  };

  const handleStop = () => {
    const url = `http://${hostIP}:${hostPort}/AufofocusController/stopAutoFocus`;

    fetch(url, { method: "GET" })
      .then((response) => response.json())
      .then((data) => {
        console.log("Autofocus stopped:", data);
        setIsRunning(false);
      })
      .catch((error) => {
        console.error("Error stopping autofocus:", error);
      });
  };

  return (
    <Paper style={{ padding: "20px" }}>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <TextField
            label="Range Z"
            value={rangeZ}
            onChange={(e) => setRangeZ(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Resolution Z"
            value={resolutionZ}
            onChange={(e) => setResolutionZ(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Defocus Z"
            value={defocusZ}
            onChange={(e) => setDefocusZ(e.target.value)}
            fullWidth
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleStart}
          >
            Start Autofocus
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleStop}
            style={{ marginLeft: "10px" }}
          >
            Stop Autofocus
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default AutofocusController;

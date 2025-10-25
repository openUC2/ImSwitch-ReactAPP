import React, { useEffect } from "react";
import { Paper, Grid, TextField, Button } from "@mui/material";
import Plot from "react-plotly.js";
import { useDispatch, useSelector } from "react-redux";
import * as autofocusSlice from "../state/slices/AutofocusSlice.js";


const AutofocusController = ({ hostIP, hostPort }) => {
  const dispatch = useDispatch();
  
  // Access autofocus state from Redux
  const autofocusState = useSelector(autofocusSlice.getAutofocusState);
  const { rangeZ, resolutionZ, defocusZ, isRunning, plotData, showPlot } = autofocusState;

  const handleStart = () => {
    const url = `${hostIP}:${hostPort}/AutofocusController/autoFocus?rangez=${rangeZ}&resolutionz=${resolutionZ}&defocusz=${defocusZ}`;
    fetch(url, { method: "GET" })
      .then((response) => response.json())
      .then(() => {
        dispatch(autofocusSlice.setIsRunning(true));
        dispatch(autofocusSlice.setShowPlot(false)); // Hide plot when starting a new run
        dispatch(autofocusSlice.clearPlotData());  // Clear old data
      })
      .catch((error) => console.error("Error starting autofocus:", error));
  };

  const handleStop = () => {
    const url = `${hostIP}:${hostPort}/AutofocusController/stopAutoFocus`;
    fetch(url, { method: "GET" })
      .then((response) => response.json())
      .then(() => dispatch(autofocusSlice.setIsRunning(false)))
      .catch((error) => console.error("Error stopping autofocus:", error));
  };

  const togglePlot = () => {
    dispatch(autofocusSlice.toggleShowPlot());
  };

  return (
    <Paper style={{ padding: "20px" }}>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <TextField
            label="Range Z"
            value={rangeZ}
            onChange={(e) => dispatch(autofocusSlice.setRangeZ(e.target.value))}
            fullWidth
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Resolution Z"
            value={resolutionZ}
            onChange={(e) => dispatch(autofocusSlice.setResolutionZ(e.target.value))}
            fullWidth
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Defocus Z"
            value={defocusZ}
            onChange={(e) => dispatch(autofocusSlice.setDefocusZ(e.target.value))}
            fullWidth
          />
        </Grid>

        <Grid item xs={12}>
          <Button variant="contained" color="primary" onClick={handleStart}>
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
          {plotData && (
            <Button
              variant="contained"
              style={{ marginLeft: "10px" }}
              onClick={togglePlot}
            >
              {showPlot ? "Close Plot" : "Show Plot"}
            </Button>
          )}
        </Grid>

        {showPlot && plotData && (
          <Grid item xs={12}>
            <Plot
              data={[
                {
                  x: plotData.x,
                  y: plotData.y,
                  type: "scatter",
                  mode: "lines+markers",
                  marker: { color: "red" },
                },
              ]}
              layout={{
                title: "Focus vs Contrast",
                xaxis: { title: "Focus Position" },
                yaxis: { title: "Contrast Value" },
              }}
              style={{ width: "100%", height: "400px" }}
            />
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default AutofocusController;

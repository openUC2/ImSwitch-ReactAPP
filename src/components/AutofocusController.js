import React, { useEffect } from "react";
import { Paper, Grid, TextField, Button, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import Plot from "react-plotly.js";
import { useDispatch, useSelector } from "react-redux";
import * as autofocusSlice from "../state/slices/AutofocusSlice.js";
import * as parameterRangeSlice from "../state/slices/ParameterRangeSlice.js";
import * as connectionSettingsSlice from "../state/slices/ConnectionSettingsSlice.js";


const AutofocusController = ({ hostIP, hostPort }) => {
  const dispatch = useDispatch();
  
  // Access autofocus state from Redux
  const autofocusState = useSelector(autofocusSlice.getAutofocusState);
  const { rangeZ, resolutionZ, defocusZ, illuminationChannel, isRunning, plotData, showPlot } = autofocusState;
  
  // Access parameter range state for available illumination sources
  const parameterRangeState = useSelector(parameterRangeSlice.getParameterRangeState);
  const connectionSettingsState = useSelector(connectionSettingsSlice.getConnectionSettingsState);
  
  // Get available illumination sources and find currently active ones
  const availableIlluminations = parameterRangeState.illuSources || [];
  
  // Function to get currently active illumination (first one that's on)
  const getCurrentlyActiveIllumination = async () => {
    if (availableIlluminations.length === 0) return null;
    
    const ip = connectionSettingsState.ip || hostIP;
    const port = connectionSettingsState.apiPort || hostPort;
    
    if (!ip || !port) return availableIlluminations[0]; // Fallback to first available
    
    try {
      for (const illumination of availableIlluminations) {
        const encodedName = encodeURIComponent(illumination);
        const response = await fetch(`${ip}:${port}/LaserController/getLaserValue?laserName=${encodedName}`);
        if (response.ok) {
          const value = await response.json();
          if (value > 0) {
            return illumination; // Return the first active illumination
          }
        }
      }
      return availableIlluminations[0]; // Fallback to first if none active
    } catch (error) {
      console.error("Error checking active illuminations:", error);
      return availableIlluminations[0]; // Fallback to first available
    }
  };
  
  // Set default illumination channel when component mounts or illumination sources change
  useEffect(() => {
    if (availableIlluminations.length > 0 && !illuminationChannel) {
      // If selected illumination is not available, find currently active one
      if (!availableIlluminations.includes(illuminationChannel)) {
        getCurrentlyActiveIllumination().then(activeIllumination => {
          if (activeIllumination) {
            dispatch(autofocusSlice.setIlluminationChannel(activeIllumination));
          }
        });
      }
    }
  }, [availableIlluminations, illuminationChannel, dispatch]);

  const handleStart = () => {
    // Use selected illumination channel or fallback to currently active one
    const selectedChannel = illuminationChannel || availableIlluminations[0];
    const url = `${hostIP}:${hostPort}/AutofocusController/autoFocus?rangez=${rangeZ}&resolutionz=${resolutionZ}&defocusz=${defocusZ}&illuminationChannel=${encodeURIComponent(selectedChannel || '')}`;
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
        <Grid item xs={3}>
          <TextField
            label="Range Z"
            value={rangeZ}
            onChange={(e) => dispatch(autofocusSlice.setRangeZ(e.target.value))}
            fullWidth
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            label="Resolution Z"
            value={resolutionZ}
            onChange={(e) => dispatch(autofocusSlice.setResolutionZ(e.target.value))}
            fullWidth
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            label="Defocus Z"
            value={defocusZ}
            onChange={(e) => dispatch(autofocusSlice.setDefocusZ(e.target.value))}
            fullWidth
          />
        </Grid>
        <Grid item xs={3}>
          <FormControl fullWidth>
            <InputLabel>Illumination Channel</InputLabel>
            <Select
              value={illuminationChannel || ''}
              onChange={(e) => dispatch(autofocusSlice.setIlluminationChannel(e.target.value))}
              label="Illumination Channel"
            >
              {availableIlluminations.map((illumination) => (
                <MenuItem key={illumination} value={illumination}>
                  {illumination}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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

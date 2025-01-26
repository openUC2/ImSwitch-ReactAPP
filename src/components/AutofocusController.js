import React, { useState, useEffect } from "react";
import { Paper, Grid, TextField, Button } from "@mui/material";
import Plot from "react-plotly.js";
import { useWebSocket } from "../context/WebSocketContext";


const AutofocusController = ({ hostIP, hostPort }) => {
  const [rangeZ, setRangeZ] = useState(10);
  const [resolutionZ, setResolutionZ] = useState(1);
  const [defocusZ, setDefocusZ] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [plotData, setPlotData] = useState(null);
  const [showPlot, setShowPlot] = useState(false);
  const socket = useWebSocket();

  useEffect(() => {
    if (!socket) 
      return;
    const handleSignal = (data) => {
      try {
        const jdata = JSON.parse(data);
        if (jdata.name === "sigUpdateFocusPlot") {
          // Store focus positions in p0, contrast values in p1
          setPlotData({ x: jdata.args.p0, y: jdata.args.p1 });
        }
        // ... other signals
      } catch (error) {
        console.error("Error parsing signal data:", error);
      }
    };
    socket.on("signal", handleSignal);
    return () => {
      socket.off("signal", handleSignal);
    };
  }, [socket]);

  const handleStart = () => {
    const url = `${hostIP}:${hostPort}/AufofocusController/autoFocus?rangez=${rangeZ}&resolutionz=${resolutionZ}&defocusz=${defocusZ}`;
    fetch(url, { method: "GET" })
      .then((response) => response.json())
      .then(() => {
        setIsRunning(true);
        setShowPlot(false); // Hide plot when starting a new run
        setPlotData(null);  // Clear old data
      })
      .catch((error) => console.error("Error starting autofocus:", error));
  };

  const handleStop = () => {
    const url = `${hostIP}:${hostPort}/AufofocusController/stopAutoFocus`;
    fetch(url, { method: "GET" })
      .then((response) => response.json())
      .then(() => setIsRunning(false))
      .catch((error) => console.error("Error stopping autofocus:", error));
  };

  const togglePlot = () => {
    setShowPlot(!showPlot);
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

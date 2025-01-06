import React, { useState, useEffect, useContext } from "react";
import {
  Paper,
  Grid,
  TextField,
  Slider,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { useWebSocket } from "../context/WebSocketContext";

const TimelapseController = ({ hostIP, hostPort }) => {
  const socket = useWebSocket();
  const [parameters, setParameters] = useState({
    nTimes: 1,
    tPeriod: 1,
    illuSources: [],
    illuSourcesSelected: [],
    illuSourceMinIntensities: [],
    illuSourceMaxIntensities: [],
    illuIntensities: [],
    exposureTimes: [],
    gain: [],
    autofocus_every_n_frames: 0,
  });
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState("");

  useEffect(() => {
    const fetchParameters = async () => {
      try {
        const response = await fetch(
          `${hostIP}:${hostPort}/TimelapseController/getCurrentTimelapseParameters`
        );
        const data = await response.json();
        setParameters(data);
      } catch (error) {
        console.error("Error fetching timelapse parameters:", error);
      }
    };

    fetchParameters();
  }, [hostIP, hostPort]);

  useEffect(() => {
    if (!socket) return;

    const handleSignal = (data) => {
      try {
        const parsedData = JSON.parse(data);
        if (parsedData.name === "sigTimelapseWorkflowUpdate") {
          const args = JSON.parse(parsedData.args.arg0.replace(/'/g, '"'));
          setCurrentStep(`Step ${args.step_id}: ${args.name}`);
        }
      } catch (error) {
        console.error("Error parsing socket message:", error);
      }
    };

    socket.on("signal", handleSignal);
    return () => {
      socket.off("signal", handleSignal);
    };
  }, [socket]);

  const handleStart = async () => {
    try {
      // force -reading exposure times and gains from the text fields
      // to ensure that the values are up-to-date
      parameters.exposureTimes = parameters.exposureTimes.map(
        (exposureTime, index) => {
          const element = document.getElementById(`exposureTime${index}`);
          return element ? parseInt(element.value) : exposureTime;
        }
      );
      parameters.gain = parameters.gain.map((gain, index) => {
        const element = document.getElementById(`gain${index}`);
        return element ? parseInt(element.value) : gain;
      });

      const filteredParameters = parameters.illuIntensities.reduce(
        (acc, intensity, index) => {
          if (intensity > 0) {
            const exposureElement = document.getElementById(
              `exposureTime${index}`
            );
            const gainElement = document.getElementById(`gain${index}`);
            acc.illuSources.push(parameters.illuSources[index]);
            acc.illuIntensities.push(intensity);
            acc.exposureTimes.push(
              exposureElement
                ? parseInt(exposureElement.value)
                : parameters.exposureTimes[index]
            );
            acc.gain.push(
              gainElement ? parseInt(gainElement.value) : parameters.gain[index]
            );
          }
          return acc;
        },
        { illuSources: [], illuIntensities: [], exposureTimes: [], gain: [] }
      );
      filteredParameters.illuSourcesSelected = filteredParameters.illuSources;
      filteredParameters.autofocus_every_n_frames = parameters.autofocus_every_n_frames;
      filteredParameters.nTimes = parameters.nTimes;
      filteredParameters.tPeriod = parameters.tPeriod; // TODO: why is this even necessry?

      const response = await fetch(
        `${hostIP}:${hostPort}/TimelapseController/start_multicolour_timelapse_workflow`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filteredParameters),
        }
      );

      const result = await response.json();
      setIsRunning(true);
      console.log("Timelapse started:", result);
    } catch (error) {
      console.error("Error starting timelapse:", error);
    }
  };

  const handleStop = async () => {
    try {
      const response = await fetch(
        `${hostIP}:${hostPort}/TimelapseController/stop_workflow`,
        { method: "get" }
      );
      const result = await response.json();
      setIsRunning(false);
      console.log("Timelapse stopped:", result);
    } catch (error) {
      console.error("Error stopping timelapse:", error);
    }
  };

  const handleChange = (field, value, index = null) => {
    setParameters((prev) => {
      if (index !== null) {
        const updatedArray = [...prev[field]];
        updatedArray[index] = value;
        return { ...prev, [field]: updatedArray };
      }
      return { ...prev, [field]: value };
    });
  };

  return (
    <Paper style={{ padding: "20px" }}>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            label="Number of Times"
            type="number"
            value={parameters.nTimes}
            onChange={(e) => handleChange("nTimes", parseInt(e.target.value))}
            fullWidth
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Time Period (s)"
            type="number"
            value={parameters.tPeriod}
            onChange={(e) => handleChange("tPeriod", parseInt(e.target.value))}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Autofocus Every N Frames"
            type="number"
            value={parameters.autofocus_every_n_frames}
            onChange={(e) =>
              handleChange("autofocus_every_n_frames", parseInt(e.target.value))
            }
            fullWidth
          />
        </Grid>
        {parameters.illuSources.map((source, index) => (
          <Grid container spacing={2} key={index}>
            <Grid item xs={6}>
              <Typography>{`Source: ${source}`}</Typography>
              <Slider
                value={parameters.illuIntensities[index] || 0}
                onChange={(e, value) =>
                  handleChange("illuIntensities", value, index)
                }
                min={parameters.illuSourceMinIntensities[index] || 0}
                max={parameters.illuSourceMaxIntensities[index] || 100}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                id={`gain${index}`}
                label="Gain"
                type="number"
                value={parameters.gain[index] || -1}
                onChange={(e) =>
                  handleChange("gain", parseInt(e.target.value), index)
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                id={`exposureTime${index}`}
                label="Exposure Time (µs)"
                type="number"
                value={parameters.exposureTimes[index] || -1}
                onChange={(e) =>
                  handleChange("exposureTimes", parseInt(e.target.value), index)
                }
                fullWidth
              />
            </Grid>
          </Grid>
        ))}
        <Grid item xs={12}>
          <Typography>{`Current Step: ${currentStep}`}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleStart}
            disabled={isRunning}
          >
            Start
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleStop}
            disabled={!isRunning}
            style={{ marginLeft: "10px" }}
          >
            Stop
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default TimelapseController;

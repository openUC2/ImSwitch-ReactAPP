import React, { useState, useEffect } from "react";
import { Paper, Grid, Button, Typography } from "@mui/material";
import { useWebSocket } from "../context/WebSocketContext";

const ObjectiveController = ({ hostIP, hostPort }) => {
  const [currentObjective, setCurrentObjective] = useState(null);
  const [pixelsize, setPixelsize] = useState(null);
  const [NA, setNA] = useState(null);
  const [magnification, setMagnification] = useState(null);
  const [objectiveName, setObjectiveName] = useState("");
  const socket = useWebSocket();

  useEffect(() => {
    if (!socket) return;
    const handleSignal = (data) => {
      try {
        const jdata = JSON.parse(data);
        if (jdata.name === "sigObjectiveChanged") {
          // Expecting parameters: [pixelsize, NA, magnification, objectiveName]
          setPixelsize(jdata.args[0]);
          setNA(jdata.args[1]);
          setMagnification(jdata.args[2]);
          setObjectiveName(jdata.args[3]);
        }
      } catch (error) {
        console.error("Error parsing signal data:", error);
      }
    };
    socket.on("signal", handleSignal);
    return () => {
      socket.off("signal", handleSignal);
    };
  }, [socket]);

  useEffect(() => {
    const url = `${hostIP}:${hostPort}/ObjectiveController/getCurrentObjective`;
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        // Expects data like: [1, "10x"]
        setCurrentObjective(data[0]);
      })
      .catch((error) =>
        console.error("Error fetching current objective:", error)
      );
  }, [hostIP, hostPort]);

  const handleCalibrate = () => {
    const url = `${hostIP}:${hostPort}/ObjectiveController/calibrateObjective`;
    fetch(url)
      .then((response) => response.json())
      .then(() => {
        // Refresh current objective after calibration
        return fetch(`${hostIP}:${hostPort}/ObjectiveController/getCurrentObjective`);
      })
      .then((response) => response.json())
      .then((data) => setCurrentObjective(data[0]))
      .catch((error) => console.error("Error calibrating objective:", error));
  };

  const handleSwitchObjective = (slot) => {
    const url = `${hostIP}:${hostPort}/ObjectiveController/moveToObjective?slot=${slot}`;
    fetch(url)
      .then((response) => response.json())
      .then(() => setCurrentObjective(slot))
      .catch((error) =>
        console.error(`Error switching to objective ${slot}:`, error)
      );
  };

  return (
    <Paper style={{ padding: "20px" }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12}>
          <Typography variant="h6">Objective Controller</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography>
            Current Objective:{" "}
            {currentObjective !== null ? currentObjective : "Unknown"}
          </Typography>
          <Typography>
            Objective Name: {objectiveName || "Unknown"}
          </Typography>
          <Typography>
            Pixelsize: {pixelsize !== null ? pixelsize : "Unknown"}
          </Typography>
          <Typography>NA: {NA !== null ? NA : "Unknown"}</Typography>
          <Typography>
            Magnification: {magnification !== null ? magnification : "Unknown"}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCalibrate}
          >
            Calibrate Objective
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => handleSwitchObjective(1)}
            style={{ marginLeft: "10px" }}
          >
            Switch to Objective 1
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => handleSwitchObjective(2)}
            style={{ marginLeft: "10px" }}
          >
            Switch to Objective 2
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ObjectiveController;

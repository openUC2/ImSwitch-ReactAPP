import React, { useState, useEffect } from "react";
import { Paper, Grid, Button, Typography, TextField } from "@mui/material";
import { useWebSocket } from "../context/WebSocketContext";

const ExtendedObjectiveController = ({ hostIP, hostPort }) => {
  const [currentObjective, setCurrentObjective] = useState(null);
  const [objectiveName, setObjectiveName] = useState("");
  const [pixelsize, setPixelsize] = useState(null);
  const [NA, setNA] = useState(null);
  const [magnification, setMagnification] = useState(null);
  const [imageUrls, setImageUrls] = useState({});
  const [pixelSize, setPixelSize] = useState(null);
  const [detectors, setDetectors] = useState([]);

  // Objective positions (x1/x2) from backend status
  const [posX1, setPosX1] = useState(null);
  const [posX2, setPosX2] = useState(null);

  // Manual input fields for positions
  const [manualX1, setManualX1] = useState("");
  const [manualX2, setManualX2] = useState("");

  const socket = useWebSocket();

  // Update objective parameters from socket signal "sigObjectiveChanged"
  useEffect(() => {
    if (!socket) return;
    const handleSignal = (data) => {
      try {
        const jdata = JSON.parse(data);
        if (jdata.name === "sigObjectiveChanged") {
          // Expected order: [pixelsize, NA, magnification, objectiveName]
          setPixelsize(jdata.args[0]);
          setNA(jdata.args[1]);
          setMagnification(jdata.args[2]);
          setObjectiveName(jdata.args[3]);
        } else if (jdata.name === "sigUpdateImage") {
          const detectorName = jdata.detectorname;
          const imgSrc = `data:image/jpeg;base64,${jdata.image}`;
          setImageUrls((prev) => ({ ...prev, [detectorName]: imgSrc }));
          if (jdata.pixelsize) setPixelSize(jdata.pixelsize);
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

  // Get detector names
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(
          `${hostIP}:${hostPort}/SettingsController/getDetectorNames`
        );
        const data = await response.json();
        setDetectors(data);
      } catch {}
    })();
  }, [hostIP, hostPort]);

  // Fetch current objective from backend on mount
  useEffect(() => {
    const fetchCurrentObjective = async () => {
      try {
        const res = await fetch(
          `${hostIP}:${hostPort}/ObjectiveController/getCurrentObjective`
        );
        const data = await res.json();
        // Expected data: [objectiveSlot, objectiveName]
        setCurrentObjective(data[0]);
        setObjectiveName(data[1]);
      } catch (error) {
        console.error("Error fetching current objective:", error);
      }
    };
    fetchCurrentObjective();
  }, [hostIP, hostPort]);

  // Fetch objective status (x1 and x2) from backend
  const refreshStatus = async () => {
    try {
      const res = await fetch(
        `${hostIP}:${hostPort}/ObjectiveController/getstatus`
      );
      const data = await res.json();
      // Assuming the response JSON contains x1 and x2 fields.
      setPosX1(data.x1);
      setPosX2(data.x2);
    } catch (error) {
      console.error("Error fetching objective status:", error);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, [hostIP, hostPort]);

  // Calibrate objective (home) and update state
  const handleCalibrate = async () => {
    try {
      await fetch(
        `${hostIP}:${hostPort}/ObjectiveController/calibrateObjective`
      );
      const res = await fetch(
        `${hostIP}:${hostPort}/ObjectiveController/getCurrentObjective`
      );
      const data = await res.json();
      setCurrentObjective(data[0]);
      setObjectiveName(data[1]);
      refreshStatus();
    } catch (error) {
      console.error("Error calibrating objective:", error);
    }
  };

  // Switch objective (slot should be 1 or 2)
  const handleSwitchObjective = async (slot) => {
    try {
      await fetch(
        `${hostIP}:${hostPort}/ObjectiveController/moveToObjective?slot=${slot}`
      );
      setCurrentObjective(slot);
      refreshStatus();
    } catch (error) {
      console.error(`Error switching to objective ${slot}:`, error);
    }
  };

  // Move the objective lens via PositionerController
  const movePositioner = async (dist) => {
    try {
      await fetch(
        `${hostIP}:${hostPort}/PositionerController/movePositioner?axis=A&dist=${dist}&isAbsolute=false&isBlocking=false`
      );
    } catch (error) {
      console.error(`Error moving positioner by ${dist} steps:`, error);
    }
  };

  // Set objective positions (x1 or x2) manually via backend
  const handleSetX1 = async (value) => {
    try {
      const numericValue = Number(value);
      if (isNaN(numericValue)) {
        throw new Error("X1 must be a number");
      }
      await fetch(
        `${hostIP}:${hostPort}/ObjectiveController/setPositions?x1=${numericValue}&isBlocking=false`
      );
      refreshStatus();
    } catch (error) {
      console.error("Error setting X1:", error);
    }
  };

  const handleSetX2 = async (value) => {
    try {
      const numericValue = Number(value);
      if (isNaN(numericValue)) {
        throw new Error("X2 must be a number");
      }
      await fetch(
        `${hostIP}:${hostPort}/ObjectiveController/setPositions?x2=${numericValue}&isBlocking=false`
      );
      refreshStatus();
    } catch (error) {
      console.error("Error setting X2:", error);
    }
  };

  // Read current position from PositionerController and set as X1 or X2
  const handleSetCurrentAs = async (which) => {
    try {
      const res = await fetch(
        `${hostIP}:${hostPort}/PositionerController/getPositionerPositions`
      );
      const data = await res.json();
      // Assuming the response structure:
      // { "ESP32Stage": { "X": ..., "Y": ..., "Z": ..., "A": ... } }
      const currentA = data.ESP32Stage.A;
      if (which === "x1") {
        await handleSetX1(currentA);
      } else if (which === "x2") {
        await handleSetX2(currentA);
      }
    } catch (error) {
      console.error(`Error setting current position as ${which}:`, error);
    }
  };

  return (
    <Paper style={{ padding: "20px" }}>
      <Grid container spacing={2}>
        {/* Objective Information */}
        <Grid item xs={12}>
          <Typography variant="h6">Objective Controller</Typography>
          <Typography>
            Current Objective:{" "}
            {currentObjective !== null ? currentObjective : "Unknown"} (
            {objectiveName || "Unknown"})
          </Typography>
          <Typography>
            Pixelsize: {pixelsize !== null ? pixelsize : "Unknown"}, NA:{" "}
            {NA !== null ? NA : "Unknown"}, Magnification:{" "}
            {magnification !== null ? magnification : "Unknown"}
          </Typography>
        </Grid>

        {/* Calibration and Switching */}
        <Grid item xs={12}>
          <Button variant="contained" color="primary" onClick={handleCalibrate}>
            Calibrate Objective
          </Button>
            <Button variant="outlined" onClick={refreshStatus}>
              Refresh Positions
            </Button>
  
        </Grid>
        <Grid item xs={2}>
          <Typography variant="h6">Detectors</Typography>
          {imageUrls[detectors[0]] ? (
            <img
              src={imageUrls[detectors[0]]}
              alt={detectors[0]}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          ) : (
            <Typography>No image from socket</Typography>
          )}
        </Grid>

        {/* Objective Lens Movement */}
        <Grid item xs={12}>
          <Typography variant="subtitle1">
            Move Objective Lens (Axis A)
          </Typography>
          <Button variant="outlined" onClick={() => movePositioner(-100)}>
            ←← (100 steps)
          </Button>
          <Button
            variant="outlined"
            onClick={() => movePositioner(-10)}
            style={{ marginLeft: "10px" }}
          >
            ← (10 steps)
          </Button>
          <Button
            variant="outlined"
            onClick={() => movePositioner(10)}
            style={{ marginLeft: "10px" }}
          >
            (10 steps) →
          </Button>
          <Button
            variant="outlined"
            onClick={() => movePositioner(100)}
            style={{ marginLeft: "10px" }}
          >
            (100 steps) →→
          </Button>
        </Grid>

        {/* Objective Positions (x1 and x2) */}
        <Grid item xs={12}>
          <Typography variant="subtitle1">Objective Positions</Typography>
          {/* X1 */}
          <Grid
            container
            spacing={1}
            alignItems="center"
            style={{ marginTop: "10px" }}
          >
            <Grid item xs={2}>
              <Typography>X1:</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography>{posX1 !== null ? posX1 : "Unknown"}</Typography>
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Set X1"
                value={manualX1}
                onChange={(e) => setManualX1(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={2}>
              <Button variant="contained" onClick={() => handleSetX1(manualX1)}>
                Set X1
              </Button>
            </Grid>
            <Grid item xs={2}>
              <Button
                variant="contained"
                onClick={() => handleSetCurrentAs("x1")}
              >
                Set Current as X1
              </Button>
            </Grid>
            <Grid item xs={2}>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => handleSwitchObjective(1)}
                style={{ marginLeft: "10px" }}
              >
                Switch to Objective 1
              </Button>
            </Grid>
          </Grid>
          {/* X2 */}
          <Grid
            container
            spacing={1}
            alignItems="center"
            style={{ marginTop: "10px" }}
          >
            <Grid item xs={2}>
              <Typography>X2:</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography>{posX2 !== null ? posX2 : "Unknown"}</Typography>
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Set X2"
                value={manualX2}
                onChange={(e) => setManualX2(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={2}>
              <Button variant="contained" onClick={() => handleSetX2(manualX2)}>
                Set X2
              </Button>
            </Grid>
            <Grid item xs={2}>
              <Button
                variant="contained"
                onClick={() => handleSetCurrentAs("x2")}
              >
                Set Current as X2
              </Button>
            </Grid>
            <Grid item xs={2}>
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
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ExtendedObjectiveController;

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Paper, Grid, Button, Typography, TextField } from "@mui/material";
import { useWebSocket } from "../context/WebSocketContext";
import LiveViewControlWrapper from "../axon/LiveViewControlWrapper";
import * as objectiveSlice from "../state/slices/ObjectiveSlice.js";

import apiPositionerControllerMovePositioner from "../backendapi/apiPositionerControllerMovePositioner.js";
import apiObjectiveControllerSetPositions from "../backendapi/apiObjectiveControllerSetPositions.js";
import apiObjectiveControllerCalibrateObjective from "../backendapi/apiObjectiveControllerCalibrateObjective.js";
import apiObjectiveControllerGetCurrentObjective from "../backendapi/apiObjectiveControllerGetCurrentObjective.js";
import apiObjectiveControllerMoveToObjective from "../backendapi/apiObjectiveControllerMoveToObjective.js";
import apiObjectiveControllerGetStatus from "../backendapi/apiObjectiveControllerGetStatus.js";
import apiPositionerControllerGetPositions from "../backendapi/apiPositionerControllerGetPositions.js";
import apiSettingsControllerGetDetectorNames from "../backendapi/apiSettingsControllerGetDetectorNames.js";

import fetchObjectiveControllerGetStatus from "../middleware/fetchObjectiveControllerGetStatus.js";
import fetchObjectiveControllerGetCurrentObjective from "../middleware/fetchObjectiveControllerGetCurrentObjective.js";

const ExtendedObjectiveController = ({ hostIP, hostPort }) => {
  //redux dispatcher
  const dispatch = useDispatch();

  // Access global Redux state
  const objectiveState = useSelector(objectiveSlice.getObjectiveState);
  ////const State = useSelector(Slice.getState);

  //states
  const [currentA, setCurrentA] = useState("");
  const [currentZ, setCurrentZ] = useState("");
  const [imageUrls, setImageUrls] = useState({});
  const [detectors, setDetectors] = useState([]);

  // Manual input fields for positions
  const [manualX1, setManualX1] = useState("");
  const [manualX2, setManualX2] = useState("");
  const [manualZ1, setManualZ1] = useState("");
  const [manualZ2, setManualZ2] = useState("");

  const socket = useWebSocket(); //TODO remove

  // Update objective parameters from socket signal "sigObjectiveChanged"
  useEffect(() => {
    if (!socket) return;
    const handleSignal = (data) => {
      try {
        const jdata = JSON.parse(data);
        if (jdata.name === "sigObjectiveChanged") {
          //Note: this is allready handled in WebSocketHandler !!!!!!!!
          // Expected order: [pixelsize, NA, magnification, objectiveName]
          ///dispatch(objectiveSlice.setPixelSize(jdata.args[0])); //setPixelsize(jdata.args[0]);
          ///dispatch(objectiveSlice.setNA(jdata.args[1])); //setNA(jdata.args[1]);
          ///dispatch(objectiveSlice.setMagnification(jdata.args[2])); //setMagnification(jdata.args[2]);
          ///dispatch(objectiveSlice.setObjectiveName(jdata.args[2])); //setObjectiveName(jdata.args[3]);
        } else if (jdata.name === "sigUpdateImage") {
          //TODO dont get wat archived here
          //TODO
          //console.log(jdata);
          //console.log(imageUrls);
          const detectorName = jdata.detectorname;
          const imgSrc = `data:image/jpeg;base64,${jdata.image}`;
          setImageUrls((prev) => ({ ...prev, [detectorName]: imgSrc }));
          if (jdata.pixelsize) {
            console.log(
              "TODO change ExtendedObjectiveController setPixelSize call"
            );
            //TODO why is pixel size grabbed from here?
            dispatch(objectiveSlice.setPixelSize(jdata.pixelsize)); //TODO is this needed? its not changed, but its frequently updated
          }
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
    //fetch current objective
    fetchObjectiveControllerGetCurrentObjective(dispatch);
    //refresh status
    refreshStatus();
    // Get detector names
    apiSettingsControllerGetDetectorNames()
      .then((data) => {
        setDetectors(data);
      })
      .catch((err) => {
        console.log("Failed to fetch detector names", err); // Handle the error
      });
  }, [hostIP, hostPort]); // on host ip/port change

  // Fetch objective status (x1 and x2) from backend
  const refreshStatus = () => {
    //request fetch status
    fetchObjectiveControllerGetStatus(dispatch);
  };

  // Calibrate objective (home) and update state
  const handleCalibrate = () => {
    //request calibrate
    apiObjectiveControllerCalibrateObjective()
      .then((data) => {
        console.info("Calibrate response");
        //fetch current objective
        fetchObjectiveControllerGetCurrentObjective(dispatch);
      })
      .catch((err) => {
        console.error("Failed to calibrate the objective"); // Handle the error
      });
  };

  // Switch objective (slot should be 1 or 2)
  const handleSwitchObjective = (slot) => {
    apiObjectiveControllerMoveToObjective(slot)
      .then((data) => {
        dispatch(objectiveSlice.setCurrentObjective(slot)); //setCurrentObjective(slot);
        refreshStatus();
      })
      .catch((err) => {
        console.error(`Error switching to objective ${slot}:`, err);
      });
  };

  // Move the objective lens via PositionerController
  const movePositioner = (dist) => {
    apiPositionerControllerMovePositioner({
      axis: "A",
      dist: dist,
      isAbsolute: false,
      isBlocking: false,
    })
      .then((positionerResponse) => {
        console.log(`Move by ${dist} successful:`, positionerResponse);
      })
      .catch((error) => {
        console.log(`Move by ${dist} error:`, error);
      });
  };

  // Set objective positions (x1 or x2) manually via backend
  const handleSetX1 = (value) => {
    //handle value
    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      console.error("Error X1 must be a number");
      return;
    }
    //api request
    apiObjectiveControllerSetPositions({
      x1: numericValue,
      isBlocking: false,
    })
      .then((data) => {
        //refresh
        refreshStatus();
      })
      .catch((err) => {
        console.error("Api eror setting X1:", err);
      });
  };

  const handleSetX2 = (value) => {
    //handle value
    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      console.error("Error X2 must be a number");
      return;
    }
    //api request
    apiObjectiveControllerSetPositions({
      x2: numericValue,
      isBlocking: false,
    })
      .then((data) => {
        //refresh
        refreshStatus();
      })
      .catch((err) => {
        console.error("Api eror setting X2:", err);
      });
  };

  const handleSetZ1 = (value) => {
    //handle value
    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      console.error("Error Z1 must be a number");
      return;
    }
    //api request
    apiObjectiveControllerSetPositions({
      z1: numericValue,
      isBlocking: false,
    })
      .then((data) => {
        //refresh
        refreshStatus();
      })
      .catch((err) => {
        console.error("Api eror setting Z1:", err);
      });
  };

  const handleSetZ2 = (value) => {
    //handle value
    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      console.error("Error Z2 must be a number");
      return;
    }
    //api request
    apiObjectiveControllerSetPositions({
      z2: numericValue,
      isBlocking: false,
    })
      .then((data) => {
        //refresh
        refreshStatus();
      })
      .catch((err) => {
        console.error("Api eror setting Z2:", err);
      });
  };

  // Read current position from PositionerController and set as X1 or X2
  const handleSetCurrentAs = async (which) => {
    apiPositionerControllerGetPositions()
      .then((data) => {
        // Handle success response
        if (data.ESP32Stage) {
          setCurrentZ(data.ESP32Stage.Z);
          setCurrentA(data.ESP32Stage.A);
        }
        else if (data.VirtualStage) {
          setCurrentZ(data.VirtualStage.Z);
          setCurrentA(data.VirtualStage.A);
        }
        if (which === "x1") {
          handleSetX1(currentA);
        } else if (which === "x2") {
          handleSetX2(currentA);
        } else if (which === "z1") {
          handleSetZ1(currentZ);
        } else if (which === "z2") {
          handleSetZ2(currentZ);
        }
      })
      .catch((err) => {
        console.error(`Error setting current position as ${which}:`, err);
      });
  };

  return (
    <Paper style={{ padding: "20px" }}>
      <Grid container spacing={2}>
        {/* Objective Information */}
        <Grid item xs={12}>
          <Typography variant="h6">Objective Controller</Typography>
          <Typography>
            Current Objective:{" "}
            {objectiveState.currentObjective !== null
              ? objectiveState.currentObjective
              : "Unknown"}{" "}
            ({objectiveState.objectivName || "Unknown"})
          </Typography>
          <Typography>
            Pixelsize:{" "}
            {objectiveState.pixelsize !== null
              ? objectiveState.pixelsize
              : "Unknown"}
            , NA: {objectiveState.NA !== null ? objectiveState.NA : "Unknown"},
            Magnification:{" "}
            {objectiveState.magnification !== null
              ? objectiveState.magnification
              : "Unknown"}
          </Typography>
        </Grid>

        {/* Calibration and Switching */}
        <Grid item xs={12}>
          <Button variant="contained" color="primary" onClick={handleCalibrate}>
            Calibrate/Home Objective
          </Button>
          <Button variant="outlined" onClick={refreshStatus}>
            Refresh Positions
          </Button>
        </Grid>
        <Grid item xs={2}>
          <Typography variant="h6">Detectors</Typography>
          <LiveViewControlWrapper />
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
              <Typography>
                {objectiveState.posX1 !== null
                  ? objectiveState.posX1
                  : "Unknown"}
              </Typography>
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
              <Typography>
                {objectiveState.posX2 !== null
                  ? objectiveState.posX2
                  : "Unknown"}
              </Typography>
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
          {/* Z1 */}
          <Grid
            container
            spacing={1}
            alignItems="center"
            style={{ marginTop: "10px" }}
          >
            <Grid item xs={2}>
              <Typography>Z1:</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography>
                {objectiveState.posZ1 !== null
                  ? objectiveState.posZ1
                  : "Unknown"}
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Set Z1"
                value={manualZ1}
                onChange={(e) => setManualZ1(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={2}>
              <Button variant="contained" onClick={() => handleSetZ1(manualZ1)}>
                Set Z1
              </Button>
            </Grid>
            <Grid item xs={2}>
              <Button
                variant="contained"
                onClick={() => handleSetCurrentAs("z1")}
              >
                Set Current as Z1
              </Button>
            </Grid>
          </Grid>
          {/* Z2 */}
          <Grid
            container
            spacing={1}
            alignItems="center"
            style={{ marginTop: "10px" }}
          >
            <Grid item xs={2}>
              <Typography>Z2:</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography>
                {objectiveState.posZ2 !== null
                  ? objectiveState.posZ2
                  : "Unknown"}
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Set Z2"
                value={manualZ2}
                onChange={(e) => setManualZ2(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={2}>
              <Button variant="contained" onClick={() => handleSetZ2(manualZ2)}>
                Set Z2
              </Button>
            </Grid>
            <Grid item xs={2}>
              <Button
                variant="contained"
                onClick={() => handleSetCurrentAs("z2")}
              >
                Set Current as Z2
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ExtendedObjectiveController;

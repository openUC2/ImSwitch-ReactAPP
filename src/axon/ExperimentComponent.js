import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Button, ButtonGroup, LinearProgress } from "@mui/material";

import * as wsUtils from "./WellSelectorUtils.js";

import InfoPopup from "./InfoPopup.js";

import * as experimentSlice from "../state/slices/ExperimentSlice.js";
import * as experimentStatusSlice from "../state/slices/ExperimentStatusSlice.js";
import * as experimentStateSlice from "../state/slices/ExperimentStateSlice.js";
import * as wellSelectorSlice from "../state/slices/WellSelectorSlice.js";
import * as objectiveSlice from "../state/slices/ObjectiveSlice.js";

import apiExperimentControllerStartWellplateExperiment from "../backendapi/apiExperimentControllerStartWellplateExperiment.js";
import apiExperimentControllerStopExperiment from "../backendapi/apiExperimentControllerStopExperiment.js";
import apiExperimentControllerPauseWorkflow from "../backendapi/apiExperimentControllerPauseWorkflow.js";
import apiExperimentControllerResumeExperiment from "../backendapi/apiExperimentControllerResumeExperiment.js";

import fetchGetExperimentStatus from "../middleware/fetchExperimentControllerGetExperimentStatus.js";
import { Shape } from "./WellSelectorCanvas.js";
import * as connectionSettingsSlice from "../state/slices/ConnectionSettingsSlice.js";
//##################################################################################
// Enum-like object for status
const Status = Object.freeze({
  IDLE: "idle",
  RUNNING: "running",
  PAUSED: "paused",
  STOPPING: "stopping",
});

//##################################################################################
const ExperimentComponent = () => {
  //state
  const infoPopupRef = useRef(null);

  //redux dispatcher
  const dispatch = useDispatch();

  // Access global Redux state
  const connectionSettingsState = useSelector(
    connectionSettingsSlice.getConnectionSettingsState
  );
  // local state to enalbe open in VTK Viewer
  const [enableViewer, setEnableViewer] = useState(false);

  // helper for the workflow step state udpates
  const [cachedStepId, setCachedStepId] = useState(0);
  const [cachedTotalSteps, setCachedTotalSteps] = useState(undefined);
  const [cachedStepName, setCachedStepName] = useState("");

  // Access global Redux state
  const experimentState = useSelector(experimentSlice.getExperimentState);
  const experimentWorkflowState = useSelector(
    experimentStateSlice.getExperimentState
  );

  const experimentStatusState = useSelector(
    experimentStatusSlice.getExperimentStatusState
  );
  const wellSelectorState = useSelector(wellSelectorSlice.getWellSelectorState);
  const objectiveState = useSelector(objectiveSlice.getObjectiveState);

  //##################################################################################
  useEffect(() => {
    //periodic experiment status fetch
    // Initial fetch
    fetchGetExperimentStatus(dispatch);

    // Set an interval to call fetchData every x seconds
    const intervalId = setInterval(() => {
      fetchGetExperimentStatus(dispatch);
    }, 3000); //Request period

    // Cleanup on component unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []); // Empty dependency array ensures this runs once on mount

  //##################################################################################
  const handleStart = () => {
    console.log("Experiment started");

    //create experiment request
    const experimentRequest = {
      name: experimentState.name,
      parameterValue: experimentState.parameterValue,
      pointList: [],
    };

    // iterate all points
    experimentState.pointList.map((itPoint) => {
      // create new point
      const point = {
        id: itPoint.id,
        name: itPoint.name,
        x: itPoint.x,
        y: itPoint.y,
        neighborPointList: [],
      };
      //calc and fill neighbor points
      // Negative overlap creates gaps, positive overlap creates overlaps
      const rasterWidthOverlaped =
        objectiveState.fovX * (1 - (experimentState.parameterValue.overlapWidth || 0));
      const rasterHeightOverlaped =
        objectiveState.fovY * (1 - (experimentState.parameterValue.overlapHeight || 0));

      if (itPoint.shape == Shape.CIRCLE) {
        //circle shape
        point.neighborPointList = wsUtils.calculateRasterOval(
          itPoint,
          rasterWidthOverlaped,
          rasterHeightOverlaped,
          itPoint.circleRadiusX,
          itPoint.circleRadiusY
        );
        //handle invalid area
        if (point.neighborPointList.length == 0) {
          point.neighborPointList = [
            { x: itPoint.x, y: itPoint.y, iX: 0, iY: 0 },
          ];
        }
      } else if (itPoint.shape == Shape.RECTANGLE) {
        //rect shape
        point.neighborPointList = wsUtils.calculateRasterRect(
          itPoint,
          rasterWidthOverlaped,
          rasterHeightOverlaped,
          itPoint.rectPlusX,
          itPoint.rectMinusX,
          itPoint.rectPlusY,
          itPoint.rectMinusY
        );
      } else {
        //no shape
        point.neighborPointList = [
          { x: itPoint.x, y: itPoint.y, iX: 0, iY: 0 },
        ];
      }

      //append point
      experimentRequest.pointList.push(point);
    });

    // Convert object to JSON
    //const jsonString = JSON.stringify(experimentRequest);

    //show reuslt
    //console.log("experiment(obj):", experimentRequest);
    //console.log("experiment(json):", jsonString);

    //create request
    apiExperimentControllerStartWellplateExperiment(experimentRequest)
      .then((data) => {
        // Handle success response
        console.log("apiStartWellplateExperiment", data);
        //set state
        dispatch(experimentStatusSlice.setStatus(Status.RUNNING));
        // enable VTK Viewer
        setEnableViewer(true);
        //set popup
        infoPopupRef.current.showMessage("Experiment started...");
      })
      .catch((err) => {
        // Handle error
        //console.error("handleStart", err)
        //set popup
        infoPopupRef.current.showMessage("Start Experiment failed");
      });
  };

  const handleOpenVTKViewer = () => {
    console.log("Fetching last OME-Zarr path to open in VTK viewer");
    //    setfullURL(${omeZarrState.zarrUrl}`); // Switch to https if needed

    fetch(
      `${connectionSettingsState.ip}:${connectionSettingsState.apiPort}/ExperimentController/getLastScanAsOMEZARR`
    )
      .then((res) => res.json())
      .then((data) => {
        // English comment: 'data' should contain the relative path like "/recordings/...ome.zarr"
        const lastZarrPath = data || "";
        // English comment: build the final URL for VTK viewer
        // https://hms-dbmi.github.io/vizarr/?source=https://localhost:8001/data/ExperimentController/20250703_122249/20250703_122249_experiment0_0_experiment_0_.ome.zarr
        // const viewerURL = `https://kitware.github.io/itk-vtk-viewer/app/?rotate=false&fileToLoad=${connectionSettingsState.ip}:${connectionSettingsState.apiPort}/data${lastZarrPath}`;
        const viewerURL = `https://hms-dbmi.github.io/vizarr/?source=${connectionSettingsState.ip}:${connectionSettingsState.apiPort}/data${lastZarrPath}`;
        window.open(viewerURL, "_blank");
      })
      .catch((err) => {
        console.error("Failed to fetch the last OME-Zarr path:", err);
        infoPopupRef.current.showMessage(
          "Failed to open last OME-Zarr in viewer"
        );
      });
  };
  //##################################################################################
  const handlePause = () => {
    console.log("Experiment paused");
    //create request
    apiExperimentControllerPauseWorkflow()
      .then((data) => {
        // Handle success response
        //set state
        dispatch(experimentStatusSlice.setStatus(Status.PAUSED));
        //set popup
        infoPopupRef.current.showMessage("Experiment paused");
      })
      .catch((err) => {
        // Handle error
        //set popup
        infoPopupRef.current.showMessage("Pause Experiment failed");
      });
  };

  //##################################################################################
  const handleResume = () => {
    console.log("Experiment resumed");
    //create request
    apiExperimentControllerResumeExperiment()
      .then((data) => {
        // Handle success response
        //set state
        dispatch(experimentStatusSlice.setStatus(Status.RUNNING));
        //set popup
        infoPopupRef.current.showMessage("Experiment resumed...");
      })
      .catch((err) => {
        // Handle error
        //set popup
        infoPopupRef.current.showMessage("Resume Experiment failed");
      });
  };

  //##################################################################################
  const handleStop = () => {
    console.log("Experiment stopped");
    //create request
    dispatch(experimentStatusSlice.setStatus(Status.IDLE)); // FIXME: This is a workaround to avoid the "stopping" status
    apiExperimentControllerStopExperiment()
      .then((data) => {
        // Handle success response
        //set state
        //set popup
        infoPopupRef.current.showMessage("Experiment stopped");
      })
      .catch((err) => {
        // Handle error
        //set popup
        console.log("handleStop", err);
        infoPopupRef.current.showMessage("Stop Experiment failed");
      });
  };

  //##################################################################################
  const showStartButton = () => {
    return (
      experimentStatusState.status === Status.IDLE ||
      experimentStatusState.status === Status.STOPPING
    );
  };

  //##################################################################################
  const showPauseButton = () => {
    return experimentStatusState.status === Status.RUNNING;
  };

  //##################################################################################
  const showResumeButton = () => {
    return experimentStatusState.status === Status.PAUSED;
  };

  //##################################################################################
  const showStopButton = () => {
    return experimentStatusState.status !== Status.IDLE;
  };

  useEffect(() => {
    if (experimentWorkflowState.totalSteps !== undefined) {
      setCachedTotalSteps(experimentWorkflowState.totalSteps);
    }
    if (experimentWorkflowState.stepId !== undefined) {
      setCachedStepId(experimentWorkflowState.stepId);
    }
    if (experimentWorkflowState.stepName) {
      setCachedStepName(experimentWorkflowState.stepName);
    }
  }, [
    experimentWorkflowState.totalSteps,
    experimentWorkflowState.stepId,
    experimentWorkflowState.stepName,
  ]);

  // Calculate progress percentage if we have valid totalSteps
  const progress =
    cachedTotalSteps && cachedTotalSteps > 0
      ? Math.floor((cachedStepId / cachedTotalSteps) * 100)
      : 0;

  //##################################################################################
  return (
    <div
      style={{
        textAlign: "left",
        padding: "10px",
        margin: "0px",
      }}
    >
      {/* Header */}
      <h4 style={{ margin: "0", padding: "0" }}>
        Experiment ({experimentStatusState.status})
      </h4>

      <ButtonGroup>
        <Button
          variant="contained"
          onClick={handleStart}
          disabled={!showStartButton()}
        >
          Start
        </Button>

        <Button
          variant="contained"
          onClick={handlePause}
          disabled={!showPauseButton()}
        >
          Pause
        </Button>

        <Button
          variant="contained"
          onClick={handleResume}
          disabled={!showResumeButton()}
        >
          Resume
        </Button>

        <Button
          variant="contained"
          onClick={handleStop}
          disabled={!showStopButton()}
        >
          Stop
        </Button>

        <Button
          variant="contained"
          onClick={handleOpenVTKViewer}
        >
          Open VIZARR (external, needs internet)
        </Button>

        {/* Display the step name (fixed width) and loading bar with percentage */}
        <span
          style={{
            marginLeft: 10,
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "140px", // Fixed width for the step name
              overflow: "hidden", // Hide overflow if name is longer
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginRight: "8px",
            }}
            title={cachedStepName}
          >
            {cachedStepName}
          </div>

          {/* Only show loading bar if totalSteps is present */}
          {cachedTotalSteps && cachedTotalSteps > 0 && (
            <>
              <div style={{ width: "100px", marginRight: "8px" }}>
                <LinearProgress variant="determinate" value={progress} />
              </div>
              <span>{progress}%</span>
            </>
          )}
        </span>
      </ButtonGroup>

      {/* Header 
      <Snackbar
        open={popupOpen}
        autoHideDuration={null} // automatically hide
        //onClose={() => setPopupOpen(false)}
        message={popupMessage}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right", // You can change this to top, left, etc.
        }}
      />*/}

      <InfoPopup ref={infoPopupRef} />
    </div>
  );
};
//##################################################################################

export default ExperimentComponent;

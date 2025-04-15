import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Button, ButtonGroup, Snackbar } from "@mui/material";

import * as wsUtils from "./WellSelectorUtils.js";

import InfoPopup from "./InfoPopup.js";

import * as experimentSlice from "../state/slices/ExperimentSlice.js";
import * as experimentStatusSlice from "../state/slices/ExperimentStatusSlice.js";
import * as wellSelectorSlice from "../state/slices/WellSelectorSlice.js";
import * as objectiveSlice from "../state/slices/ObjectiveSlice.js";

import apiExperimentControllerStartWellplateExperiment from "../backendapi/apiExperimentControllerStartWellplateExperiment.js";
import apiExperimentControllerStopExperiment from "../backendapi/apiExperimentControllerStopExperiment.js";
import apiExperimentControllerPauseWorkflow from "../backendapi/apiExperimentControllerPauseWorkflow.js";
import apiExperimentControllerResumeExperiment from "../backendapi/apiExperimentControllerResumeExperiment.js";

import fetchGetExperimentStatus from "../middleware/fetchExperimentControllerGetExperimentStatus.js";
import { Shape } from "./WellSelectorCanvas.js";

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
  const experimentState = useSelector(experimentSlice.getExperimentState);
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
      const rasterWidthOverlaped =
        objectiveState.fovX * (1 - wellSelectorState.overlapWidth);
      const rasterHeightOverlaped =
        objectiveState.fovY * (1 - wellSelectorState.overlapHeight);

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
            point.neighborPointList = [{ x: itPoint.x, y: itPoint.y, iX: 0, iY: 0 }];
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
      }
      else
      {
        //no shape
        point.neighborPointList = [{ x: itPoint.x, y: itPoint.y, iX: 0, iY: 0 }];
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

  //##################################################################################
  return (
    <div
      style={{
        border: "1px solid #eee",
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

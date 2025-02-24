import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Button, ButtonGroup, Snackbar } from "@mui/material";

import * as wsUtils from "./WellSelectorUtils.js";

import * as experimentSlice from "../state/slices/ExperimentSlice.js";
import * as experimentStatusSlice from "../state/slices/ExperimentStatusSlice.js";
import * as wellSelectorSlice from "../state/slices/WellSelectorSlice.js";

import apiStartWellplateExperiment from "../backendapi/apiStartWellplateExperiment.js";
import apiStopExperiment from "../backendapi/apiStopExperiment.js";
import apiPauseWorkflow from "../backendapi/apiPauseWorkflow.js";
import apiResumeExperiment from "../backendapi/apiResumeExperiment.js";
import fetchGetExperimentStatus from "../middleware/fetchGetExperimentStatus.js";

//##################################################################################
// Enum-like object for status
const Status = Object.freeze({
  IDLE: "idle",
  RUNNING: "running",
  PAUSED: "paused",
});

//##################################################################################
const ExperimentComponent = () => {
  //state
  //const [status, setStatus] = useState(Status.IDLE); //TODO move to experiment slice

  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  //redux dispatcher
  const dispatch = useDispatch();

  // Access global Redux state
  const experimentState = useSelector(experimentSlice.getExperimentState);
  const experimentStatusState = useSelector(experimentStatusSlice.getExperimentStatusState);
  const wellSelectorState = useSelector(wellSelectorSlice.getWellSelectorState);


  //##################################################################################
  useEffect(() => {//popup time out handler
    if (popupOpen) {
      const timer = setTimeout(() => {
        setPopupOpen(false);
      }, 3000); // Close after 3 seconds

      return () => clearTimeout(timer); // Cleanup on unmount or when `popupOpen` changes
    }
  }, [popupOpen]);

  //##################################################################################
  useEffect(() => {//periodic experiment status fetch
    // Initial fetch
    fetchGetExperimentStatus(dispatch);

    // Set an interval to call fetchData every x seconds 
    const intervalId = setInterval(() => {
        fetchGetExperimentStatus(dispatch);
      }, 3000);//Request period

    // Cleanup on component unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []); // Empty dependency array ensures this runs once on mount

  //##################################################################################
  const showPopupMessage = (message) => {
      setPopupMessage(message);
      setPopupOpen(true);
  }
 

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
        wellSelectorState.rasterWidth * (1 - wellSelectorState.overlapWidth);
      const rasterHeightOverlaped =
        wellSelectorState.rasterHeight * (1 - wellSelectorState.overlapHeight);
      if (itPoint.shape == "circle") {
        point.neighborPointList = wsUtils.calculateNeighborPointsCircle(
          itPoint.x,
          itPoint.y,
          rasterWidthOverlaped,
          rasterHeightOverlaped,
          itPoint.neighborsX
        );
      } else if (itPoint.shape == "rectangle") {
        point.neighborPointList = wsUtils.calculateNeighborPointsSquare(
          itPoint.x,
          itPoint.y,
          rasterWidthOverlaped,
          rasterHeightOverlaped,
          itPoint.neighborsX,
          itPoint.neighborsY
        );
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
    apiStartWellplateExperiment(experimentRequest)
      .then((data) => {
        // Handle success response
        console.log("apiStartWellplateExperiment", data);
        //set state 
        dispatch(experimentStatusSlice.setStatus(Status.RUNNING));
        //set popup
        showPopupMessage("Experiment started..."); 
      })
      .catch((err) => {
        // Handle error
        //console.error("handleStart", err)
        //set popup
        showPopupMessage("Start Experiment failed"); 
      });
  };

  //##################################################################################
  const handlePause = () => {
    console.log("Experiment paused");
    //create request
    apiPauseWorkflow()
      .then((data) => {
        // Handle success response
        //set state 
        dispatch(experimentStatusSlice.setStatus(Status.PAUSED));
        //set popup
        showPopupMessage("Experiment paused"); 
      })
      .catch((err) => {
        // Handle error
        //set popup
        showPopupMessage("Pause Experiment failed"); 
      });
  };

  //##################################################################################
  const handleResume = () => {
    console.log("Experiment resumed");
    //create request
    apiResumeExperiment()
      .then((data) => {
        // Handle success response
        //set state 
        dispatch(experimentStatusSlice.setStatus(Status.RUNNING));
        //set popup
        showPopupMessage("Experiment resumed..."); 
      })
      .catch((err) => {
        // Handle error
        //set popup
        showPopupMessage("Resume Experiment failed"); 
      });
  };

  //##################################################################################
  const handleStop = () => {
    console.log("Experiment stopped");
    setPopupOpen(true);
    //create request
    apiStopExperiment()
      .then((data) => {
        // Handle success response
        //set state 
        dispatch(experimentStatusSlice.setStatus(Status.IDLE));
        //set popup
        showPopupMessage("Experiment stopped"); 
      })
      .catch((err) => {
        // Handle error
        //set popup
        showPopupMessage("Stop Experiment failed"); 
      });
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
      <h4 style={{ margin: "0", padding: "0" }}>Experiment ({experimentStatusState.status})</h4>

      <ButtonGroup>
        <Button
          variant="contained"
          onClick={handleStart}
          disabled={experimentStatusState.status !== Status.IDLE}
        >
          Start
        </Button>

        <Button
          variant="contained"
          onClick={handlePause}
          disabled={experimentStatusState.status !== Status.RUNNING}
        >
          Pause
        </Button>

        <Button
          variant="contained"
          onClick={handleResume}
          disabled={experimentStatusState.status !== Status.PAUSED}
        >
          Resume
        </Button>

        <Button
          variant="contained"
          onClick={handleStop}
          disabled={experimentStatusState.status === Status.IDLE}
        >
          Stop
        </Button>
      </ButtonGroup>

      <Snackbar
        open={popupOpen}
        autoHideDuration={null} // automatically hide
        //onClose={() => setPopupOpen(false)}
        message={popupMessage}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right", // You can change this to top, left, etc.
        }}
      />
    </div>
  );
};
//##################################################################################

export default ExperimentComponent;

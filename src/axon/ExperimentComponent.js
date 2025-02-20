import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Button, ButtonGroup } from "@mui/material";

import * as wsUtils from "./WellSelectorUtils.js";

import * as experimentSlice from "../state/slices/ExperimentSlice.js";
import * as wellSelectorSlice from "../state/slices/WellSelectorSlice.js";

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
  const [status, setStatus] = useState(Status.IDLE);//TODO move to experiment slice

  //redux dispatcher
  const dispatch = useDispatch();

  // Access global Redux state
  const experimentState = useSelector(experimentSlice.getExperimentState);
  const wellSelectorState = useSelector(wellSelectorSlice.getWellSelectorState);

  //##################################################################################
  const handleStart = () => {
    console.log("Experiment started");
    //set state
    setStatus(Status.RUNNING);

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
    const jsonString = JSON.stringify(experimentRequest);

    //show reuslt
    console.log("experiment(obj):", experimentRequest);
    console.log("experiment(json):", jsonString);


    //TODO create request------------------
    console.error("TODO IMPLEMENT REQUEST");

  };

  //##################################################################################
  const handlePause = () => {
    console.log("Experiment paused");
    setStatus(Status.PAUSED);
    //TODO create request------------------
    console.error("TODO IMPLEMENT REQUEST");
  };

  //##################################################################################
  const handleResume = () => {
    console.log("Experiment resumed");
    setStatus(Status.RUNNING);
    //TODO create request------------------
    console.error("TODO IMPLEMENT REQUEST");
  };

  //##################################################################################
  const handleStop = () => {
    console.log("Experiment stopped");
    setStatus(Status.IDLE);
    //TODO create request------------------
    console.error("TODO IMPLEMENT REQUEST");
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
      <h4 style={{ margin: "0", padding: "0" }}>Experiment</h4>

      <ButtonGroup>
        <Button
          variant="contained"
          onClick={handleStart}
          disabled={status !== Status.IDLE}
        >
          Start
        </Button>

        <Button
          variant="contained"
          onClick={handlePause}
          disabled={status !== Status.RUNNING}
        >
          Pause
        </Button>

        <Button
          variant="contained"
          onClick={handleResume}
          disabled={status !== Status.PAUSED}
        >
          Resume
        </Button>

        <Button
          variant="contained"
          onClick={handleStop}
          disabled={status === Status.IDLE}
        >
          Stop
        </Button>
      </ButtonGroup>
    </div>
  );
};
//##################################################################################

export default ExperimentComponent;

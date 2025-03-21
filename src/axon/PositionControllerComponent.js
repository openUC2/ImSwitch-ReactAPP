import React, { useState } from "react";

import {
  Button,
  Input,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
} from "@mui/material";

import apiPositionerControllerMovePositioner from "../backendapi/apiPositionerControllerMovePositioner.js";

//##################################################################################
const PositionControllerComponent = () => {
  const [intervalId, setIntervalId] = useState(null);

  const moveDistance = 500;//TODO adjust
  const zoomDistance = 100;//TODO adjust
 
  //##################################################################################
  const movePositioner = (axis, dist) => {
    apiPositionerControllerMovePositioner({
      axis,
      dist,
      isAbsolute: false,
    })
      .then((positionerResponse) => {
        console.log(`Move ${axis} by ${dist} successful:`, positionerResponse);
      })
      .catch((error) => {
        console.log(`Move ${axis} by ${dist} error:`, error);
      });
  };

  //##################################################################################
  const startPeriodicRequest = (action) => {
    // Start calling movePosition repeatedly
    const id = setInterval(() => {
      switch (action) {
        case "minus": 
          movePositioner("Z", -zoomDistance);
          break;
        case "plus":  
          movePositioner("Z", zoomDistance);
          break;
        case "up": 
          movePositioner("Y", moveDistance);
          break;
        case "down": 
          movePositioner("Y", -moveDistance);
          break;
        case "left": 
          movePositioner("X", moveDistance);
          break;
        case "right": 
          movePositioner("X", -moveDistance);
          break;
        default:
            console.log("ERROR unhandled action:", action);
          break;
      }
    }, 100); // 100ms interval, adjust as needed
    setIntervalId(id);
  };

  //##################################################################################
  const stopPeriodicRequest = () => {
    // Clear the interval to stop calling movePosition
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  //##################################################################################
  return (
    <div
      className="arrow-container"
      style={{
        padding: "10px",
        border: "0px solid white",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <div style={{ display: "flex", gap: "4px" }}>
        <Button
          variant="contained"
          onMouseDown={() => startPeriodicRequest("minus")}
          onMouseUp={stopPeriodicRequest}
          onMouseLeave={stopPeriodicRequest}
        >
          -
        </Button>
        <Button
          variant="contained"
          onMouseDown={() => startPeriodicRequest("up")}
          onMouseUp={stopPeriodicRequest}
          onMouseLeave={stopPeriodicRequest}
        >
          ↑
        </Button>
        <Button
          variant="contained"
          onMouseDown={() => startPeriodicRequest("plus")}
          onMouseUp={stopPeriodicRequest}
          onMouseLeave={stopPeriodicRequest}
        >
          +
        </Button>
      </div>

      <div style={{ display: "flex", gap: "4px" }}>
        <Button
          variant="contained"
          onMouseDown={() => startPeriodicRequest("left")}
          onMouseUp={stopPeriodicRequest}
          onMouseLeave={stopPeriodicRequest}
        >
          ←
        </Button>
        <Button
          variant="contained"
          onMouseDown={() => startPeriodicRequest("down")}
          onMouseUp={stopPeriodicRequest}
          onMouseLeave={stopPeriodicRequest}
        >
          ↓
        </Button>
        <Button
          variant="contained"
          onMouseDown={() => startPeriodicRequest("right")}
          onMouseUp={stopPeriodicRequest}
          onMouseLeave={stopPeriodicRequest}
        >
          →
        </Button>
      </div>
    </div>
  );
};
//##################################################################################
export default PositionControllerComponent;

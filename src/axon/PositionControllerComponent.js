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

  const moveDistance = 5000;//TODO adjust
  const zoomDistance = 100;//TODO adjust

  //##################################################################################
  const moveUp = () => {
    apiPositionerControllerMovePositioner({
      axis: "Y",
      dist: moveDistance,
      isAbsolute: false,
    })
      .then((positionerResponse) => {
        console.log("Moved successfully:", positionerResponse);
      })
      .catch((error) => {
        console.log("Moved error:", error);
      });
  };

  //##################################################################################
  const moveDown = () => {
    apiPositionerControllerMovePositioner({
      axis: "Y",
      dist: -moveDistance,
      isAbsolute: false,
    })
      .then((positionerResponse) => {
        console.log("Moved successfully:", positionerResponse);
      })
      .catch((error) => {
        console.log("Moved error:", error);
      });
  };

  //##################################################################################
  const moveLeft = () => {
    apiPositionerControllerMovePositioner({
      axis: "X",
      dist: moveDistance,
      isAbsolute: false,
    })
      .then((positionerResponse) => {
        console.log("Moved successfully:", positionerResponse);
      })
      .catch((error) => {
        console.log("Moved error:", error);
      });
  };

  //##################################################################################
  const moveRight = () => {
    apiPositionerControllerMovePositioner({
      axis: "X",
      dist: -moveDistance,
      isAbsolute: false,
    })
      .then((positionerResponse) => {
        console.log("Moved successfully:", positionerResponse);
      })
      .catch((error) => {
        console.log("Moved error:", error);
      });
  };

  //##################################################################################
  const zoomPlus = () => {
    apiPositionerControllerMovePositioner({
      axis: "Z",
      dist: zoomDistance,
      isAbsolute: false,
    })
      .then((positionerResponse) => {
        console.log("Zoom successfully:", positionerResponse);
      })
      .catch((error) => {
        console.log("Zoom error:", error);
      });
  };

  //##################################################################################
  const zoomMinus = () => {
    apiPositionerControllerMovePositioner({
      axis: "Z",
      dist: -zoomDistance,
      isAbsolute: false,
    })
      .then((positionerResponse) => {
        console.log("Zoom successfully:", positionerResponse);
      })
      .catch((error) => {
        console.log("Zoom error:", error);
      });
  };

  //##################################################################################
  const startPeriodicRequest = (action) => {
    // Start calling movePosition repeatedly
    const id = setInterval(() => {
      switch (action) {
        case "minus":
          zoomMinus();
          break;
        case "plus":
          zoomPlus();
          break;
        case "up":
          moveUp();
          break;
        case "down":
          moveDown();
          break;
        case "left":
          moveLeft();
          break;
        case "right":
          moveRight();
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

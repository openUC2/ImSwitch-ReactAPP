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

//##################################################################################
const PositionControllerComponent = () => {
  const [intervalId, setIntervalId] = useState(null);

  //##################################################################################
  const movePosition = (direction) => {
    const url = `https://imswitch.openuc2.com/PositionerController/movePositioner?positionerName=VirtualStage&speed=20000&axis=`;

    let axis, dist;

    const speed = 5000;

    switch (direction) {
      case "up":
        axis = "Y";
        dist = speed;
        break;
      case "down":
        axis = "Y";
        dist = -speed;
        break;
      case "left":
        axis = "X";
        dist = speed;
        break;
      case "right":
        axis = "X";
        dist = -speed;
        break;
      default:
        return;
    }

    const apiUrl = `${url}${axis}&dist=${dist}&isAbsolute=false&isBlocking=false&speed=20000`;

    // Send the request to the server
    fetch(apiUrl)
      .then((response) => response.json())
      .then((data) => {
        console.log("Moved Successfully:", data);
      })
      .catch((error) => {
        console.error("Moved Error:", error);
      });
  };

  //##################################################################################
  const startMoving = (direction) => {
    // Start calling movePosition repeatedly
    const id = setInterval(() => {
      movePosition(direction);
    }, 100); // 100ms interval, adjust as needed
    setIntervalId(id);
  };

  //##################################################################################
  const stopMoving = () => {
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
        display: 'flex', flexDirection: 'column', gap: '4px'
      }}
    >
      <div style={{  display: 'flex', gap: '4px' }}>
        <Button
         variant="contained"
          onMouseDown={() => startMoving("minus")}
          onMouseUp={stopMoving}
          onMouseLeave={stopMoving}
        >
          -
        </Button>
        <Button
         variant="contained"
          onMouseDown={() => startMoving("up")}
          onMouseUp={stopMoving}
          onMouseLeave={stopMoving} 
        >
          ↑
        </Button>
        <Button
         variant="contained"
          onMouseDown={() => startMoving("plus")}
          onMouseUp={stopMoving}
          onMouseLeave={stopMoving} 
        >
          +
        </Button>
      </div>

      <div style={{  display: 'flex', gap: '4px' }}>
        <Button
         variant="contained"
          onMouseDown={() => startMoving("left")}
          onMouseUp={stopMoving}
          onMouseLeave={stopMoving} 
        >
          ←
        </Button>
        <Button
         variant="contained"
          onMouseDown={() => startMoving("down")}
          onMouseUp={stopMoving}
          onMouseLeave={stopMoving} 
        >
          ↓
        </Button>
        <Button
         variant="contained"
          onMouseDown={() => startMoving("right")}
          onMouseUp={stopMoving}
          onMouseLeave={stopMoving} 
        >
          →
        </Button>
      </div>
    </div>
  );
};
//##################################################################################
export default PositionControllerComponent;

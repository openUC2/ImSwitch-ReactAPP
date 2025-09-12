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
  useTheme,
  useMediaQuery,
} from "@mui/material";

import apiPositionerControllerMovePositioner from "../backendapi/apiPositionerControllerMovePositioner.js";

//##################################################################################
const PositionControllerComponent = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
        padding: isMobile ? "16px" : "10px",
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? "8px" : "4px",
      }}
    >
      <div style={{ display: "flex", gap: isMobile ? "8px" : "4px" }}>
        <Button
          variant="contained"
          onMouseDown={() => startPeriodicRequest("minus")}
          onMouseUp={stopPeriodicRequest}
          onMouseLeave={stopPeriodicRequest}
          onTouchStart={() => startPeriodicRequest("minus")}
          onTouchEnd={stopPeriodicRequest}
          sx={{
            minHeight: isMobile ? 60 : 48,
            minWidth: isMobile ? 60 : 48,
            fontSize: isMobile ? '1.2rem' : '1rem',
            touchAction: 'manipulation',
            userSelect: 'none',
          }}
        >
          -
        </Button>
        <Button
          variant="contained"
          onMouseDown={() => startPeriodicRequest("up")}
          onMouseUp={stopPeriodicRequest}
          onMouseLeave={stopPeriodicRequest}
          onTouchStart={() => startPeriodicRequest("up")}
          onTouchEnd={stopPeriodicRequest}
          sx={{
            minHeight: isMobile ? 60 : 48,
            minWidth: isMobile ? 60 : 48,
            fontSize: isMobile ? '1.2rem' : '1rem',
            touchAction: 'manipulation',
            userSelect: 'none',
          }}
        >
          ↑
        </Button>
        <Button
          variant="contained"
          onMouseDown={() => startPeriodicRequest("plus")}
          onMouseUp={stopPeriodicRequest}
          onMouseLeave={stopPeriodicRequest}
          onTouchStart={() => startPeriodicRequest("plus")}
          onTouchEnd={stopPeriodicRequest}
          sx={{
            minHeight: isMobile ? 60 : 48,
            minWidth: isMobile ? 60 : 48,
            fontSize: isMobile ? '1.2rem' : '1rem',
            touchAction: 'manipulation',
            userSelect: 'none',
          }}
        >
          +
        </Button>
      </div>

      <div style={{ display: "flex", gap: isMobile ? "8px" : "4px" }}>
        <Button
          variant="contained"
          onMouseDown={() => startPeriodicRequest("left")}
          onMouseUp={stopPeriodicRequest}
          onMouseLeave={stopPeriodicRequest}
          onTouchStart={() => startPeriodicRequest("left")}
          onTouchEnd={stopPeriodicRequest}
          sx={{
            minHeight: isMobile ? 60 : 48,
            minWidth: isMobile ? 60 : 48,
            fontSize: isMobile ? '1.2rem' : '1rem',
            touchAction: 'manipulation',
            userSelect: 'none',
          }}
        >
          ←
        </Button>
        <Button
          variant="contained"
          onMouseDown={() => startPeriodicRequest("down")}
          onMouseUp={stopPeriodicRequest}
          onMouseLeave={stopPeriodicRequest}
          onTouchStart={() => startPeriodicRequest("down")}
          onTouchEnd={stopPeriodicRequest}
          sx={{
            minHeight: isMobile ? 60 : 48,
            minWidth: isMobile ? 60 : 48,
            fontSize: isMobile ? '1.2rem' : '1rem',
            touchAction: 'manipulation',
            userSelect: 'none',
          }}
        >
          ↓
        </Button>
        <Button
          variant="contained"
          onMouseDown={() => startPeriodicRequest("right")}
          onMouseUp={stopPeriodicRequest}
          onMouseLeave={stopPeriodicRequest}
          onTouchStart={() => startPeriodicRequest("right")}
          onTouchEnd={stopPeriodicRequest}
          sx={{
            minHeight: isMobile ? 60 : 48,
            minWidth: isMobile ? 60 : 48,
            fontSize: isMobile ? '1.2rem' : '1rem',
            touchAction: 'manipulation',
            userSelect: 'none',
          }}
        >
          →
        </Button>
      </div>
    </div>
  );
};
//##################################################################################
export default PositionControllerComponent;

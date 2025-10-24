import React, { useState, useEffect, useRef } from "react";

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
import apiPositionerControllerMovePositionerForever from "../backendapi/apiPositionerControllerMovePositionerForever.js";

//##################################################################################
const PositionControllerComponent = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [intervalId, setIntervalId] = useState(null);

  const moveDistance = 500;//TODO adjust
  const zoomDistance = 100;//TODO adjust
  const keyMoveDistance = 100; // Distance for keyboard single press
  const continuousMoveSpeed = 5000; // Speed for continuous movement

  // Track pressed keys and their timers
  const keyTimersRef = useRef({});
  const keyPressedRef = useRef({});
 
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
  // Move positioner continuously (forever mode)
  const movePositionerForever = (axis, speed, is_stop) => {
    apiPositionerControllerMovePositionerForever({
      axis,
      speed,
      is_stop,
    })
      .then((positionerResponse) => {
        console.log(`Move forever ${axis} speed ${speed} stop=${is_stop}:`, positionerResponse);
      })
      .catch((error) => {
        console.log(`Move forever ${axis} error:`, error);
      });
  };

  //##################################################################################
  // Keyboard event handlers
  const handleKeyDown = (event) => {
    // Prevent default browser behavior for arrow keys
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
    }

    // Ignore if key is already pressed (prevents key repeat)
    if (keyPressedRef.current[event.key]) {
      return;
    }

    keyPressedRef.current[event.key] = true;

    // Set a timer for 1 second - if still pressed, switch to continuous mode
    keyTimersRef.current[event.key] = setTimeout(() => {
      // Key held for more than 1 second, start continuous movement
      let axis = null;
      let speed = continuousMoveSpeed;

      switch (event.key) {
        case 'ArrowLeft':
          axis = 'X';
          speed = -continuousMoveSpeed; // Negative for left
          break;
        case 'ArrowRight':
          axis = 'X';
          speed = continuousMoveSpeed; // Positive for right
          break;
        case 'ArrowUp':
          axis = 'Y';
          speed = continuousMoveSpeed; // Positive for up
          break;
        case 'ArrowDown':
          axis = 'Y';
          speed = -continuousMoveSpeed; // Negative for down
          break;
        default:
          return;
      }

      if (axis) {
        movePositionerForever(axis, speed, false); // Start continuous movement
      }
    }, 1000); // 1 second delay
  };

  //##################################################################################
  const handleKeyUp = (event) => {
    if (!keyPressedRef.current[event.key]) {
      return;
    }

    // Determine axis first
    let axis = null;
    let dist = keyMoveDistance;

    switch (event.key) {
      case 'ArrowLeft':
        axis = 'X';
        dist = -keyMoveDistance;
        break;
      case 'ArrowRight':
        axis = 'X';
        dist = keyMoveDistance;
        break;
      case 'ArrowUp':
        axis = 'Y';
        dist = keyMoveDistance;
        break;
      case 'ArrowDown':
        axis = 'Y';
        dist = -keyMoveDistance;
        break;
      default:
        keyPressedRef.current[event.key] = false;
        return;
    }

    // Check if the timer is still running (less than 1 second)
    const timerExists = keyTimersRef.current[event.key] !== undefined;
    
    if (timerExists) {
      // Timer still running = key was pressed for less than 1 second
      clearTimeout(keyTimersRef.current[event.key]);
      delete keyTimersRef.current[event.key];
      
      // Do a single move
      if (axis) {
        movePositioner(axis, dist);
      }
    } else {
      // Timer already fired = key was held for more than 1 second
      // Stop continuous movement
      if (axis) {
        movePositionerForever(axis, continuousMoveSpeed, true);
      }
    }

    keyPressedRef.current[event.key] = false;
  };

  //##################################################################################
  // Add and remove keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Cleanup function to remove listeners and clear timers
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      // Clear all timers on unmount
      Object.values(keyTimersRef.current).forEach(timer => clearTimeout(timer));
      keyTimersRef.current = {};
      keyPressedRef.current = {};
    };
  }, []); // Empty dependency array means this effect runs once on mount

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

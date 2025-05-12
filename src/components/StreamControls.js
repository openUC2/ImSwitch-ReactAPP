import React from "react";
import { Button } from "@mui/material";
import {
  PlayArrow,
  Stop,
  CameraAlt,
  FiberManualRecord,
  Stop as StopIcon,
} from "@mui/icons-material";

export default function StreamControls({
  isStreamRunning,
  onToggleStream,
  onSnap,
  isRecording,
  onStartRecord,
  onStopRecord,
}) {
  return (
    <>
      <Button
        onClick={onToggleStream}
        variant="contained"
        color={isStreamRunning ? "secondary" : "primary"}
      >
        {isStreamRunning ? <Stop /> : <PlayArrow />}
        {isStreamRunning ? "Stop Stream" : "Start Stream"}
      </Button>
      <Button onClick={onSnap}>
        <CameraAlt />
      </Button>
      <Button
        onClick={onStartRecord}
        sx={{
          animation: isRecording ? "blinker 1s linear infinite" : "none",
          "@keyframes blinker": {
            "50%": { opacity: 0 },
          },
        }}
      >
        <FiberManualRecord />
      </Button>
      <Button onClick={onStopRecord}>
        <StopIcon />
      </Button>
    </>
  );
}

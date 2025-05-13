import React from "react";
import { Box, IconButton, TextField, Typography } from "@mui/material";
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
  snapFileName,
  setSnapFileName,
}) {
  // English comment: Render stream controls with editable image name and icon buttons
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
      {/* English comment: Stream toggle icon button */}
      <Typography variant="h6">Stream</Typography>
      <IconButton
        color={isStreamRunning ? "secondary" : "primary"}
        onClick={onToggleStream}
      >
        {isStreamRunning ? <Stop /> : <PlayArrow />}
      </IconButton>
      {/* English comment: Editable image name field */}
      <TextField
        label="Image Name"
        size="small"
        value={snapFileName}
        onChange={(e) => setSnapFileName(e.target.value)}
        sx={{ width: 180 }}
      />
      {/* English comment: Snap icon button */}
      <IconButton color="primary" onClick={onSnap}>
        <CameraAlt />
      </IconButton>
      {/* English comment: Record icon buttons */}
      {!isRecording ? (
        <IconButton color="secondary" onClick={onStartRecord}
          sx={{
            animation: isRecording ? "blinker 1s linear infinite" : "none",
            "@keyframes blinker": {
              "50%": { opacity: 0 },
            },
          }}
        >
          <FiberManualRecord />
        </IconButton>
      ) : (
        <IconButton color="error" onClick={onStopRecord}>
          <StopIcon />
        </IconButton>
      )}
    </Box>
  );
}
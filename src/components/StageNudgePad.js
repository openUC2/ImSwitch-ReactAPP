import React from "react";
import { Button, Box } from "@mui/material";

export default function StageNudgePad({ onMove }) {
  return (
    <Box>
      <Button variant="contained" onClick={() => onMove("up")} sx={{ mb: 1 }}>
        ↑
      </Button>
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button variant="contained" onClick={() => onMove("left")}>
          ←
        </Button>
        <Button variant="contained" onClick={() => onMove("right")}>
          →
        </Button>
      </Box>
      <Button variant="contained" onClick={() => onMove("down")} sx={{ mt: 1 }}>
        ↓
      </Button>
    </Box>
  );
}

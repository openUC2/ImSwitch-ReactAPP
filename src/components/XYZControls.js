import {
  Box,
  Typography,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import ResponsiveAxisControl from "./ResponsiveAxisControl";
import CNCStyleControls from "./CNCStyleControls";
import ImprovedAxisControl from "./ImprovedAxisControl";
import { ViewList, Dashboard, Tune } from "@mui/icons-material";
import * as positionSlice from "../state/slices/PositionSlice.js";

function XYZControls({ hostIP, hostPort }) {
  const [positionerName, setPositionerName] = useState("");
  const [viewMode, setViewMode] = useState("improved"); // "individual", "cnc", or "improved"

  // Get positions from Redux instead of local state
  const positionState = useSelector(positionSlice.getPositionState);

  // Map Redux state to positions object (x, y, z, a -> X, Y, Z, A)
  const positions = {
    X: positionState.x,
    Y: positionState.y,
    Z: positionState.z,
    A: positionState.a,
  };

  /* --- initial fetch for positioner name --- */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(
          `${hostIP}:${hostPort}/PositionerController/getPositionerNames`
        );
        const d = await r.json();
        setPositionerName(d[0]);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [hostIP, hostPort]);

  /* --- layout: stack controllers vertically with compact zoom --- */
  return (
    <Box
      sx={{
        transform: "scale(0.8)",
        transformOrigin: "top left",
        width: "125%", // Compensate for scale to maintain container width
        mb: "-10%", // Reduce bottom margin to account for scaling
      }}
    >
      <Paper sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">Multi-Axis Position Control</Typography>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="improved">
              <Tune fontSize="small" />
              Improved
            </ToggleButton>
            <ToggleButton value="individual">
              <ViewList fontSize="small" />
              Individual
            </ToggleButton>
            <ToggleButton value="cnc">
              <Dashboard fontSize="small" />
              CNC Style
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {viewMode === "improved" ? (
          <ImprovedAxisControl
            hostIP={hostIP}
            hostPort={hostPort}
            positionerName={positionerName}
            positions={positions}
          />
        ) : viewMode === "individual" ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {Object.keys(positions).map((axis) => (
              <ResponsiveAxisControl
                key={axis}
                axisLabel={axis}
                hostIP={hostIP}
                hostPort={hostPort}
                positionerName={positionerName}
                mPosition={positions[axis]}
              />
            ))}
          </Box>
        ) : (
          <CNCStyleControls
            hostIP={hostIP}
            hostPort={hostPort}
            positionerName={positionerName}
            positions={positions}
          />
        )}
      </Paper>
    </Box>
  );
}

export default XYZControls;

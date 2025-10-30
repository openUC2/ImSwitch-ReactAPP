import { Box, Checkbox, Slider, Typography, Paper, Grid } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import AxisControl from "./AxisControl";
import * as positionSlice from "../state/slices/PositionSlice.js";

function XYZControls({ hostIP, hostPort }) {
  const [positionerName, setPositionerName] = useState("");
  
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
        const r = await fetch(`${hostIP}:${hostPort}/PositionerController/getPositionerNames`);
        const d = await r.json();
        setPositionerName(d[0]);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [hostIP, hostPort]);

  /* --- layout: stack controllers vertically --- */
  return (
        <Paper sx={{ p: 2 }}>

    <Grid container direction="column" spacing={2}>
      {Object.keys(positions).map((axis) => (
        <Grid item key={axis}>
          <AxisControl
            axisLabel={axis}
            hostIP={hostIP}
            hostPort={hostPort}
            positionerName={positionerName}
            mPosition={positions[axis]}
          />
        </Grid>
      ))}
    </Grid>
    </Paper>

  );
}

export default XYZControls;

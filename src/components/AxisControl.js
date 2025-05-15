import { Button, Grid, TextField, Typography } from "@mui/material";
import React, { useState } from "react";

const AxisControl = ({
  axisLabel, // "X", "Y", "Z" …
  hostIP, // e.g. "http://192.168.4.10"
  hostPort, // e.g. 8000
  positionerName, // backend name
  mPosition, // live position value
}) => {
  const [relStep, setRelStep] = useState(1000);
  const [absTarget, setAbsTarget] = useState(0);
  const [speed, setSpeed] = useState(20000);

  const w = 100;
  const txtStyle = { minWidth: w, width: w, p: 0 };

  const call = async (url) => {
    try {
      await fetch(url);
    } catch (e) {
      console.error(e);
    }
  };

  const base = `${hostIP}:${hostPort}/PositionerController`;

  const moveRel = (d) =>
    call(
      `${base}/movePositioner?positionerName=${positionerName}` +
        `&axis=${axisLabel}&dist=${d}&isAbsolute=false&isBlocking=false&speed=${speed}`
    );

  const moveAbs = () =>
    call(
      `${base}/movePositioner?positionerName=${positionerName}` +
        `&axis=${axisLabel}&dist=${absTarget}&isAbsolute=true&isBlocking=false&speed=${speed}`
    );

  const homeAxis = () =>
    call(
      `${base}/homeAxis?positionerName=${positionerName}` +
        `&axis=${axisLabel}&isBlocking=false`
    );

  const stopAxis = () =>
    call(
      `${base}/stopAxis?positionerName=${positionerName}&axis=${axisLabel}`
    );



return (
  <Grid container spacing={1}>
    {/* First row - Relative movement */}
    <Grid item xs={12}>
      <Grid container spacing={1} alignItems="center">
        <Grid item>
          <TextField
            label="Current Pos"
            type="number"
            size="small"
            variant="filled"
            value={mPosition}
            inputProps={{ readOnly: true, style: { textAlign: "right" } }}
            sx={txtStyle}
          />
        </Grid>
        <Grid item>
          <TextField
            label="Steps"
            type="number"
            size="small"
            variant="outlined"
            value={relStep}
            onChange={(e) => setRelStep(Number(e.target.value))}
            sx={txtStyle}
          />
        </Grid>
        <Grid item>
          <TextField
            label="Speed"
            type="number"
            size="small"
            variant="outlined"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            sx={txtStyle}
          />
        </Grid>
        <Grid item>
          <Button
            size="small"
            variant="contained"
            sx={{ minWidth: w, px: 1, py: 0.5 }}
            onClick={() => moveRel(+relStep)}
          >
            ←
          </Button>
        </Grid>
        <Grid item>
          <Button
            size="small"
            variant="contained"
            sx={{ minWidth: w, px: 1, py: 0.5 }}
            onClick={() => moveRel(-relStep)}
          >
            →
          </Button>
        </Grid>
      </Grid>
    </Grid>

    {/* Second row - Absolute movement */}
    <Grid item xs={12}>
      <Grid container spacing={1} alignItems="center">
        <Grid item sx={{ width: "120px" }} /> {/* Spacer */}
        <Grid item>
          <TextField
            label="Absolute"
            type="number"
            size="small"
            variant="outlined"
            value={absTarget}
            onChange={(e) => setAbsTarget(Number(e.target.value))}
            sx={txtStyle}
          />
        </Grid>
        <Grid item>
          <Button
            size="small"
            variant="contained"
            sx={{ minWidth: w, px: 1, py: 0.5 }}
            onClick={moveAbs}
          >
            Go
          </Button>
        </Grid>
        <Grid item>
          <Button
            size="small"
            variant="contained"
            color="secondary"
            sx={{ minWidth: w, px: 1, py: 0.5 }}
            onClick={homeAxis}
          >
            Home
          </Button>
        </Grid>
        <Grid item>
          <Button
            size="small"
            variant="contained"
            color="error"
            sx={{ minWidth: w, px: 1, py: 0.5 }}
            onClick={stopAxis}
          >
            Stop
          </Button>
        </Grid>
      </Grid>
    </Grid>
  </Grid>
);
};
export default AxisControl;

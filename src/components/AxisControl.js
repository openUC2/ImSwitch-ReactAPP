import {
  Button,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";

const AxisControl = ({
  axisLabel,      // "X", "Y", "Z" …
  hostIP,         // e.g. "http://192.168.4.10"
  hostPort,       // e.g. 8000
  positionerName, // backend name
  mPosition,      // live position value
}) => {
  const [relStep, setRelStep]     = useState(1000);
  const [absTarget, setAbsTarget] = useState(0);
  const [speed, setSpeed]         = useState(20000);

  const w = 68;
  const txtStyle = { minWidth: w, width: w, p: 0 };

  const call = async (url) => {
    try { await fetch(url); } catch (e) { console.error(e); }
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

  return (
    <Grid container direction="row" alignItems="center" spacing={1} wrap="nowrap">
      <Grid item>
        <Typography variant="subtitle2">{axisLabel}</Typography>
      </Grid>

      <Grid item>
        <TextField
          size="small"
          variant="filled"
          value={mPosition}
          inputProps={{ readOnly: true, style: { textAlign: "right" } }}
          sx={txtStyle}
        />
      </Grid>
      <Grid item>
        <Typography variant="subtitle2">Steps: </Typography>
      </Grid>

      <Grid item>
        <TextField
          size="small"
          variant="outlined"
          type="number"
          value={relStep}
          onChange={(e) => setRelStep(Number(e.target.value))}
          sx={txtStyle}
        />
      </Grid>

      <Grid item>
        <Typography variant="subtitle2">Speed: </Typography>
      </Grid>

      <Grid item>
        <TextField
          size="small"
          variant="outlined"
          type="number"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          sx={txtStyle}
        />
      </Grid>

      <Grid item>
        <Button
          size="small"
          variant="contained"
          sx={{ minWidth: w, p: "4px 0" }}
          onClick={() => moveRel(+relStep)}
        >
          ←
        </Button>
      </Grid>
      <Grid item>
        <Button
          size="small"
          variant="contained"
          sx={{ minWidth: w, p: "4px 0" }}
          onClick={() => moveRel(-relStep)}
        >
          →
        </Button>
      </Grid>

      <Grid item>
        <Typography variant="subtitle2">Absolute: </Typography>
      </Grid>

      <Grid item>
        <TextField
          size="small"
          variant="outlined"
          type="number"
          value={absTarget}
          onChange={(e) => setAbsTarget(Number(e.target.value))}
          sx={txtStyle}
        />
      </Grid>
      <Grid item>
        <Button
          size="small"
          variant="contained"
          sx={{ minWidth: w, p: "4px 0" }}
          onClick={moveAbs}
        >
          Go
        </Button>
      </Grid>

      <Grid item>
        <Button
          size="small"
          color="secondary"
          variant="contained"
          sx={{ minWidth: w, p: "4px 0" }}
          onClick={homeAxis}
        >
          Home
        </Button>
      </Grid>
    </Grid>
  );
};

export default AxisControl;

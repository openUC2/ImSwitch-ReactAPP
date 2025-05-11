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
  positionerName, // returned by backend
  mPosition,      // live position value
}) => {
  const [relStep, setRelStep]       = useState(1000);   // µm / encoder‑ticks
  const [absTarget, setAbsTarget]   = useState(0);      // absolute position

  const w = 68;                                    // unified width in px
  const txtStyle = { minWidth: w, width: w, p: 0 };

  const call = async (url) => {
    try { await fetch(url); } catch (e) { console.error(e); }
  };

  const base = `${hostIP}:${hostPort}/PositionerController`;

  const moveRel  = (d)     => call(
    `${base}/movePositioner?positionerName=${positionerName}` +
    `&axis=${axisLabel}&dist=${d}&isAbsolute=false&isBlocking=false`
  );

  const moveAbs  = ()      => call(
    `${base}/movePositioner?positionerName=${positionerName}` +
    `&axis=${axisLabel}&dist=${absTarget}&isAbsolute=true&isBlocking=false`
  );

  const homeAxis = ()      => call(
    `${base}/homeAxis?positionerName=${positionerName}` +
    `&axis=${axisLabel}&isBlocking=false`
  );

  return (
    <Grid container direction="row" alignItems="center" spacing={1} wrap="nowrap">
      {/* label */}
      <Grid item>
        <Typography variant="subtitle2">{axisLabel} :</Typography>
      </Grid>

      {/* live position – read‑only */}
      <Grid item>
        <TextField
          size="small"
          variant="filled"
          value={mPosition}
          inputProps={{ readOnly: true, style: { textAlign: "right" } }}
          sx={txtStyle}
        />
      </Grid>

      {/* relative step size */}
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

      {/* relative motion */}
      <Grid item>
        <Button
          size="small"
          variant="contained"
          sx={{ minWidth: w, p: "4px 0" }}
          onClick={() => moveRel(+relStep)}
        >
          Forward
        </Button>
      </Grid>
      <Grid item>
        <Button
          size="small"
          variant="contained"
          sx={{ minWidth: w, p: "4px 0" }}
          onClick={() => moveRel(-relStep)}
        >
          Backward
        </Button>
      </Grid>

      {/* absolute target */}
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

      {/* homing */}
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

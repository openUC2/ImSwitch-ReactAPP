import { Button, TextField, Grid, Slider } from '@mui/material';
import React, { useRef, useEffect, useState } from "react";
import AxisControl from "./AxisControl";

function XYZControls({ onButtonPress, hostIP }) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={4}>
        <AxisControl axisLabel="X" onButtonPress={onButtonPress} hostIP={hostIP} />
      </Grid>
      <Grid item xs={4}>
        <AxisControl axisLabel="Y" onButtonPress={onButtonPress} hostIP={hostIP} />
      </Grid>
      <Grid item xs={4}>
        <AxisControl axisLabel="Z" onButtonPress={onButtonPress} hostIP={hostIP} />
      </Grid>
    </Grid>
  );
}

export default XYZControls;
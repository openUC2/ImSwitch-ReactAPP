import React from 'react';
import { Button, TextField, Grid } from '@mui/material';


const AxisControl = ({ axisLabel }) => (
  <Grid container spacing={1} direction="column" alignItems="center">
    <Grid item>
      <h2>{axisLabel} Axis</h2>
    </Grid>
    <Grid container item spacing={1} alignItems="center">
      <Grid item>
        <Button variant="contained">+</Button>
      </Grid>
      <Grid item>
        <TextField label="Steps" variant="outlined" size="small" />
      </Grid>
      <Grid item>
        <Button variant="contained">-</Button>
      </Grid>
    </Grid>
    <Grid item>
      <Button variant="contained" color="primary">Go To</Button>
    </Grid>
    <Grid item>
      <TextField label="Speed" variant="outlined" size="small" />
    </Grid>
    <Grid item>
      <Button variant="contained" color="secondary">Stop</Button>
    </Grid>
    <Grid item>
      <Button variant="contained">Home</Button>
    </Grid>
  </Grid>
);

const XYZControls = () => (
  <Grid container spacing={3}>
    <Grid item>
      <AxisControl axisLabel="X" />
    </Grid>
    <Grid item>
      <AxisControl axisLabel="Y" />
    </Grid>
    <Grid item>
      <AxisControl axisLabel="Z" />
    </Grid>
  </Grid>
);

export default XYZControls;

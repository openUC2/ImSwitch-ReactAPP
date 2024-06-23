// ControlPanel2.js
import React from 'react';
import { Grid, Paper, Typography, Slider, TextField, Switch } from '@mui/material';
import DraggableWidget from './DraggableWidget';
import FlowStopWidget from './FlowStopWidget';
import Widget from './Widget';
import FlowStopController from './FlowStopController';
import './Tab_Widgets.css'; // Import the CSS file

const Tab_Widgets = ({ hostIP, hostPort }) => {
  return (
    <Grid container spacing={3} className="control-panel-grid">
      <Grid item xs={12} sm={6} md={4} className="grid-item">
        <Widget hostIP={hostIP} hostPort={hostPort} title="Widget" />
      </Grid>
      <Grid item xs={12} sm={6} md={4} className="grid-item">
        <FlowStopController hostIP={hostIP} hostPort={hostPort} title="Flow Stop" />
      </Grid>
    </Grid>
  );
};
export default Tab_Widgets;

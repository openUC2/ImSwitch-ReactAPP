// ControlPanel2.js
import React from 'react';
import { Grid, Paper, Typography, Slider, TextField, Switch } from '@mui/material';
import DraggableWidget from './DraggableWidget';
import Widget from './Widget';
import HistoScanController from './HistoScanController';
import MCTController from './MCTController';
import { MCTProvider } from '../context/MCTContext'; // Import the context provider
import UC2Controller from './UC2Controller';
import AutofocusController from './AutofocusController';
import './Tab_Widgets.css'; // Import the CSS file

const Tab_Widgets = ({ hostIP, hostPort }) => {
  return (
    <Grid container spacing={3} className="control-panel-grid">
      <Grid item xs={12} sm={6} md={4} className="grid-item">
        <UC2Controller hostIP={hostIP} hostPort={hostPort} title="Reconnect" />
      </Grid>
      <Grid item xs={12} sm={6} md={4} className="grid-item">
        <AutofocusController hostIP={hostIP} hostPort={hostPort} title="Autofocus" />
      </Grid>
      <Grid item xs={12} sm={6} md={4} className="grid-item">
        <MCTProvider>
          <MCTController hostIP={hostIP} hostPort={hostPort} title="MCT" />
        </MCTProvider>
      </Grid>
      <Grid item xs={12} sm={6} md={4} className="grid-item">
        <HistoScanController hostIP={hostIP} hostPort={hostPort} title="HistoScan" />
      </Grid>      
    </Grid>
  );
};
export default Tab_Widgets;

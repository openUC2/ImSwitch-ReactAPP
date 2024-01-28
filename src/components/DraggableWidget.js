import React from 'react';
import { Paper, Typography, Slider, TextField, Switch } from '@mui/material';

const DraggableWidget = ({ title }) => {

    const handleSliderChange = (event, newValue) => {
        // Führen Sie hier Ihren Code aus, um den neuen Schiebereglerwert zu verarbeiten
        console.log(newValue);
    };
    
    return (
        <Paper style={{ padding: 10, margin: 10, pointerEvents: 'none' }}>
            <Typography variant="h6" style={{ pointerEvents: 'auto' }}>{title}</Typography>
            <Slider className="no-drag" onChange={handleSliderChange} defaultValue={30} aria-labelledby="continuous-slider" style={{ pointerEvents: 'auto' }} />
            <TextField className="no-drag" label="Input" variant="outlined" size="small" style={{ marginTop: 10, pointerEvents: 'auto' }} />
            <Switch className="no-drag" defaultChecked style={{ pointerEvents: 'auto' }} />
        </Paper>
    );
};

export default DraggableWidget;
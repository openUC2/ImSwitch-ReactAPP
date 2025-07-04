import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Checkbox, Slider, Typography, Paper, Grid } from "@mui/material";

import * as experimentSlice from "../state/slices/ExperimentSlice.js";
import * as parameterRangeSlice from "../state/slices/ParameterRangeSlice.js";
import * as connectionSettingsSlice from "../state/slices/ConnectionSettingsSlice.js";
import fetchExperimentControllerGetCurrentExperimentParams from "../middleware/fetchExperimentControllerGetCurrentExperimentParams.js";
import fetchLaserControllerCurrentValues from "../middleware/fetchLaserControllerCurrentValues.js";

export default function IlluminationController({ hostIP, hostPort }) {
  const dispatch = useDispatch();
  
  // Get state from Redux instead of local state
  const parameterRangeState = useSelector(parameterRangeSlice.getParameterRangeState);
  const experimentState = useSelector((state) => state.experimentState);
  const connectionSettingsState = useSelector(connectionSettingsSlice.getConnectionSettingsState);
  
  // Local state for laser active status since it's not in Redux yet
  const [laserActiveStates, setLaserActiveStates] = useState([]);

  // Initialize experiment params and laser values on mount
  useEffect(() => {
    // Fetch experiment parameters which includes laser sources
    fetchExperimentControllerGetCurrentExperimentParams(dispatch);
  }, [dispatch]);

  // Fetch current laser values when laser sources are available
  useEffect(() => {
    if (parameterRangeState.illuSources.length > 0) {
      // Use connection settings from Redux if available, otherwise fall back to props
      const ip = connectionSettingsState.ip || hostIP;
      const port = connectionSettingsState.apiPort || hostPort;
      
      if (ip && port) {
        fetchLaserControllerCurrentValues(dispatch, { ip, apiPort: port }, parameterRangeState.illuSources);
      }
      
      // Initialize active states for each laser (default to false)
      setLaserActiveStates(new Array(parameterRangeState.illuSources.length).fill(false));
    }
  }, [dispatch, parameterRangeState.illuSources, connectionSettingsState.ip, connectionSettingsState.apiPort, hostIP, hostPort]);

  // Fetch laser names, value ranges, and current values from backend and update Redux state
  useEffect(() => {
    async function fetchIlluminationData() {
      try {
        // Fetch laser names
        const namesRes = await fetch(`${hostIP}:${hostPort}/LaserController/getLaserNames`);
        const names = await namesRes.json();
        dispatch(parameterRangeSlice.setIlluSources(names));

        // Fetch value ranges and current values for each laser
        const minArr = [];
        const maxArr = [];
        const valueArr = [];
        for (const name of names) {
          const encodedName = encodeURIComponent(name);
          // Value range
          const rangeRes = await fetch(`${hostIP}:${hostPort}/LaserController/getLaserValueRanges?laserName=${encodedName}`);
          const range = await rangeRes.json();
          minArr.push(range[0]);
          maxArr.push(range[1]);
          // Current value
          const valueRes = await fetch(`${hostIP}:${hostPort}/LaserController/getLaserValue?laserName=${encodedName}`);
          const value = await valueRes.json();
          valueArr.push(value);
        }
        dispatch(parameterRangeSlice.setIlluSourceMinIntensities(minArr));
        dispatch(parameterRangeSlice.setIlluSourceMaxIntensities(maxArr));
        dispatch(parameterRangeSlice.setilluIntensities(valueArr));
      } catch (e) {
        console.error("Failed to fetch illumination data", e);
      }
    }
    fetchIlluminationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostIP, hostPort, dispatch]);

  // Update laser value using Redux and backend
  const setLaserValue = async (idx, val) => {
    // Update Redux state
    const currentValues = experimentState.parameterValue.illuIntensities || [];
    const newValues = [...currentValues];
    newValues[idx] = val;
    dispatch(experimentSlice.setIlluminationIntensities(newValues));
    
    // Update backend
    const laserName = parameterRangeState.illuSources[idx];
    if (laserName) {
      const ip = connectionSettingsState.ip || hostIP;
      const port = connectionSettingsState.apiPort || hostPort;
      
      if (ip && port) {
        try {
          const encodedLaserName = encodeURIComponent(laserName);
          await fetch(`${ip}:${port}/LaserController/setLaserValue?laserName=${encodedLaserName}&value=${val}`);
        } catch (error) {
          console.error("Failed to set laser value in backend:", error);
        }
      }
    }
  };

  // Update laser active state
  const setLaserActive = async (idx, active) => {
    // Update local active state (since this isn't in Redux yet)
    const newActiveStates = [...laserActiveStates];
    newActiveStates[idx] = active;
    setLaserActiveStates(newActiveStates);
    
    // Update backend
    const laserName = parameterRangeState.illuSources[idx];
    if (laserName) {
      const ip = connectionSettingsState.ip || hostIP;
      const port = connectionSettingsState.apiPort || hostPort;
      
      if (ip && port) {
        try {
          const encodedLaserName = encodeURIComponent(laserName);
          await fetch(`${ip}:${port}/LaserController/setLaserActive?laserName=${encodedLaserName}&active=${active}`);
        } catch (error) {
          console.error("Failed to set laser active state in backend:", error);
        }
      }
    }
  };

  // Get laser data from Redux state
  const laserSources = parameterRangeState.illuSources || [];
  const laserValues = experimentState.parameterValue.illuIntensities || [];
  const laserMinValues = parameterRangeState.illuSourceMinIntensities || [];
  const laserMaxValues = parameterRangeState.illuSourceMaxIntensities || [];

  return (
    <Paper sx={{ p: 2 }}>
      <Grid container direction="column" spacing={2}>
        {laserSources.length ? (
          laserSources.map((laserName, idx) => {
            const currentValue = laserValues[idx] || 0;
            const minValue = laserMinValues[idx] || 0;
            const maxValue = laserMaxValues[idx] || 1023;
            const isActive = laserActiveStates[idx] || false;
            
            return (
              <Grid
                item
                key={laserName}
                sx={{ display: "flex", alignItems: "center", gap: 2 }}
              >
                {/* Laser name */}
                <Typography sx={{ minWidth: 80 }}>{laserName}</Typography>

                {/* Slider with dynamic min and max */}
                <Slider
                  value={currentValue}
                  min={minValue}
                  max={maxValue}
                  onChange={(e) => setLaserValue(idx, e.target.value)}
                  sx={{ flex: 1 }}
                />

                {/* Current slider value */}
                <Typography sx={{ mx: 1 }}>{currentValue}</Typography>

                {/* Active checkbox */}
                <Checkbox
                  checked={isActive}
                  onChange={(e) => setLaserActive(idx, e.target.checked)}
                />
              </Grid>
            );
          })
        ) : (
          <Typography>Loading laser names…</Typography>
        )}
      </Grid>
    </Paper>
  );
}
import React, { useEffect, useState, useRef, useCallback } from "react";
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

  // Debounce refs for laser value updates to prevent serial overload
  const laserTimeoutRefs = useRef([]);
  const LASER_UPDATE_DEBOUNCE_MS = 300; // Wait 300ms after user stops adjusting

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
      
      // Initialize timeout refs array for each laser
      laserTimeoutRefs.current = new Array(parameterRangeState.illuSources.length).fill(null);
    }
  }, [dispatch, parameterRangeState.illuSources, connectionSettingsState.ip, connectionSettingsState.apiPort, hostIP, hostPort]);

  // Cleanup timeout refs on unmount
  useEffect(() => {
    return () => {
      // Clear all pending timeouts
      laserTimeoutRefs.current.forEach(timeoutRef => {
        if (timeoutRef) {
          clearTimeout(timeoutRef);
        }
      });
    };
  }, []);

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

  // Debounced laser value update to prevent serial overload
  const debouncedSetLaserValue = useCallback((idx, val) => {
    // Update Redux state immediately for UI responsiveness
    const currentValues = experimentState.parameterValue.illuIntensities || [];
    const newValues = [...currentValues];
    newValues[idx] = val;
    dispatch(experimentSlice.setIlluminationIntensities(newValues));
    
    // Clear existing timeout for this laser
    if (laserTimeoutRefs.current[idx]) {
      clearTimeout(laserTimeoutRefs.current[idx]);
    }
    
    // Set new timeout to send to backend after user stops adjusting
    laserTimeoutRefs.current[idx] = setTimeout(async () => {
      const laserName = parameterRangeState.illuSources[idx];
      if (laserName) {
        const ip = connectionSettingsState.ip || hostIP;
        const port = connectionSettingsState.apiPort || hostPort;
        
        if (ip && port) {
          try {
            const encodedLaserName = encodeURIComponent(laserName);
            await fetch(`${ip}:${port}/LaserController/setLaserValue?laserName=${encodedLaserName}&value=${val}`);
            console.log(`${laserName} intensity updated to: ${val}`);
          } catch (error) {
            console.error("Failed to set laser value in backend:", error);
          }
        }
      }
    }, LASER_UPDATE_DEBOUNCE_MS);
  }, [dispatch, experimentState.parameterValue.illuIntensities, parameterRangeState.illuSources, connectionSettingsState.ip, connectionSettingsState.apiPort, hostIP, hostPort]);

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
        {/* Rate limiting info */}
        <Grid item>
          <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic' }}>
            📡 Rate-limited: Laser updates sent 300ms after you stop adjusting to prevent serial overload
          </Typography>
        </Grid>
        
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
                <Box sx={{ flex: 1, px: 1 }}>
                  <Slider
                    value={currentValue}
                    min={minValue}
                    max={maxValue}
                    onChange={(e) => debouncedSetLaserValue(idx, e.target.value)}
                    sx={{ width: '100%' }}
                    valueLabelDisplay="auto"
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="textSecondary">{minValue}</Typography>
                    <Typography variant="caption" color="textSecondary">{maxValue}</Typography>
                  </Box>
                </Box>

                {/* Current slider value */}
                <Typography sx={{ minWidth: 60, textAlign: 'center' }}>{currentValue}</Typography>

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
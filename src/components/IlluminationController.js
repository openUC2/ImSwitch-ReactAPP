import React, { useEffect, useState } from "react";
import { Box, Checkbox, Slider, Typography, Paper, Grid } from "@mui/material";

export default function IlluminationController({ hostIP, hostPort }) {
  const [lasers, setLasers] = useState([]);

  // Fetch laser names and initialize their values
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${hostIP}:${hostPort}/LaserController/getLaserNames`);
        const names = await r.json();

        // Fetch value ranges for each laser
        const lasersWithRanges = await Promise.all(
          names.map(async (name) => {
            try {
              const rangeResponse = await fetch(
                `${hostIP}:${hostPort}/LaserController/getLaserValueRanges?laserName=${encodeURIComponent(name)}`
              );
              const [min, max] = await rangeResponse.json();
              return { name, value: 0, active: false, min, max };
            } catch {
              return { name, value: 0, active: false, min: 0, max: 1023 }; // Default range
            }
          })
        );

        setLasers(lasersWithRanges);
      } catch {
        console.error("Failed to fetch laser names or ranges.");
      }
    })();
  }, [hostIP, hostPort]);

  // Update laser value
  const setLaserValue = async (idx, val) => {
    const n = encodeURIComponent(lasers[idx].name);
    try {
      await fetch(`${hostIP}:${hostPort}/LaserController/setLaserValue?laserName=${n}&value=${val}`);
    } catch {
      console.error("Failed to set laser value.");
    }
    setLasers((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, value: val } : l))
    );
  };

  // Update laser active state
  const setLaserActive = async (idx, active) => {
    const n = encodeURIComponent(lasers[idx].name);
    try {
      await fetch(
        `${hostIP}:${hostPort}/LaserController/setLaserActive?laserName=${n}&active=${active}`
      );
    } catch {
      console.error("Failed to set laser active state.");
    }
    setLasers((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, active } : l))
    );
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Grid container direction="column" spacing={2}>
        {lasers.length ? (
          lasers.map((l, idx) => (
            <Grid
              item
              key={l.name}
              sx={{ display: "flex", alignItems: "center", gap: 2 }}
            >
              {/* Laser name */}
              <Typography sx={{ minWidth: 80 }}>{l.name}</Typography>

              {/* Slider with dynamic min and max */}
              <Slider
                value={l.value}
                min={0}
                max={l.max}
                onChange={(e) => setLaserValue(idx, e.target.value)}
                sx={{ flex: 1 }}
              />

              {/* Current slider value */}
              <Typography sx={{ mx: 1 }}>{l.value}</Typography>

              {/* Active checkbox */}
              <Checkbox
                checked={l.active}
                onChange={(e) => setLaserActive(idx, e.target.checked)}
              />
            </Grid>
          ))
        ) : (
          <Typography>Loading laser names…</Typography>
        )}
      </Grid>
    </Paper>
  );
}
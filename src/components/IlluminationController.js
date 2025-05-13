import React, { useEffect, useState } from "react";
import { Box, Checkbox, Slider, Typography, Paper, Grid } from "@mui/material";


export default function IlluminationController({ hostIP, hostPort }) {
  const [lasers, setLasers] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${hostIP}:${hostPort}/LaserController/getLaserNames`);
        const names = await r.json();
        setLasers(
          names.map((n) => ({
            name: n,
            value: 0,
            active: false,
          }))
        );
      } catch {}
    })();
  }, [hostIP, hostPort]);

  const setLaserValue = async (idx, val) => {
    const n = encodeURIComponent(lasers[idx].name);
    try {
      await fetch(`${hostIP}:${hostPort}/LaserController/setLaserValue?laserName=${n}&value=${val}`);
    } catch {}
    setLasers((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, value: val } : l))
    );
  };

  const setLaserActive = async (idx, active) => {
    const n = encodeURIComponent(lasers[idx].name);
    try {
      await fetch(
        `${hostIP}:${hostPort}/LaserController/setLaserActive?laserName=${n}&active=${active}`
      );
    } catch {}
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
              {/* English comment: Laser name */}
              <Typography sx={{ minWidth: 80 }}>{l.name}</Typography>

              {/* English comment: Fill available space with slider */}
              <Slider
                value={l.value}
                min={0}
                max={1023}
                onChange={(e) => setLaserValue(idx, e.target.value)}
                sx={{ flex: 1 }}
              />

              {/* English comment: Current slider value */}
              <Typography sx={{ mx: 1 }}>{l.value}</Typography>

              {/* English comment: Active checkbox */}
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

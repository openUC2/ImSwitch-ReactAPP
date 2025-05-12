import React, { useEffect, useState } from "react";
import { Box, Checkbox, Slider, Typography } from "@mui/material";

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

  return lasers.length ? (
    lasers.map((l, idx) => (
      <Box key={l.name} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Typography sx={{ width: 80 }}>{l.name}</Typography>
        <Slider
          value={l.value}
          min={0}
          max={1023}
          onChange={(e) => setLaserValue(idx, e.target.value)}
          sx={{ flex: 1, mx: 2 }}
        />
          <Typography sx={{ mx: 1 }}>{l.value}</Typography>
        <Checkbox
          checked={l.active}
          onChange={(e) => setLaserActive(idx, e.target.checked)}
        />
      </Box>
    ))
  ) : (
    <Typography>Loading laser names…</Typography>
  );
}

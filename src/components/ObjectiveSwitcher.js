import React, { useState, useEffect } from "react";
import { Paper, Grid, Button, Typography } from "@mui/material";

// backend helpers (adjust import paths if different)
import apiObjectiveControllerMoveToObjective from "../backendapi/apiObjectiveControllerMoveToObjective.js";
import apiObjectiveControllerGetCurrentObjective from "../backendapi/apiObjectiveControllerGetCurrentObjective.js";

export default function ObjectiveSwitcher({ hostIP, hostPort }) {
  const [currentSlot, setCurrentSlot] = useState(null);     // 1 or 2
  const [name, setName]               = useState("");
  const [magnification, setMag]       = useState(null);
  const [na, setNA]                   = useState(null);
  const [pixelsize, setPixelsize]     = useState(null);

  /* --- fetch current objective on mount / when address changes --- */
  useEffect(() => {
    refreshInfo();
  }, [hostIP, hostPort]);

  const refreshInfo = async () => {
    try {
      const d = await apiObjectiveControllerGetCurrentObjective();
      // expected order: [pixelsize, NA, magnification, objectiveName, slot]
      setPixelsize(d[0]);
      setNA(d[1]);
      setMag(d[2]);
      setName(d[3]);
      setCurrentSlot(d[4]);
    } catch (e) {
      console.error("Failed to fetch current objective", e);
    }
  };

  /* --- switcher --- */
  const switchTo = async (slot) => {
    try {
      await apiObjectiveControllerMoveToObjective(slot);
      await refreshInfo();      // update UI
    } catch (e) {
      console.error(`Error switching to objective ${slot}`, e);
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Grid container spacing={2} alignItems="center">

        {/* info */}
        <Grid item xs={12}>
          <Typography>
            Current:{" "}
            {currentSlot != null ? `Slot ${currentSlot}` : "—"}{" "}
            {name && `(${name})`}
          </Typography>
          <Typography sx={{ fontSize: "0.9rem" }}>
            {magnification != null && `Mag: ${magnification}×  • `}
            {na != null && `NA ${na}  • `}
            {pixelsize != null && `Pixel ${pixelsize} µm`}
          </Typography>
        </Grid>

        {/* buttons */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item>
              <Button
                variant="contained"
                color={currentSlot === 1 ? "secondary" : "primary"}
                onClick={() => switchTo(1)}
              >
                Switch to Objective 1
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                color={currentSlot === 2 ? "secondary" : "primary"}
                onClick={() => switchTo(2)}
              >
                Switch to Objective 2
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}

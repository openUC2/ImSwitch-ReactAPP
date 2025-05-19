import React, { useState, useEffect } from "react";
import { Paper, Grid, Button, Typography } from "@mui/material";
import * as objectiveSlice from "../state/slices/ObjectiveSlice.js";
import { useDispatch, useSelector } from "react-redux";

// backend helpers (adjust import paths if different)
import apiObjectiveControllerMoveToObjective from "../backendapi/apiObjectiveControllerMoveToObjective.js";
import apiObjectiveControllerGetCurrentObjective from "../backendapi/apiObjectiveControllerGetCurrentObjective.js";

export default function ObjectiveSwitcher({ hostIP, hostPort }) {
  const [currentSlot, setCurrentSlot] = useState(null);     // 1 or 2
  const [magnifications, setMagnifications] = useState({ 1: null, 2: null }); // Magnifications for each slot

    // Access global Redux state
    const objectiveState = useSelector(objectiveSlice.getObjectiveState);
  
      // Fetch magnifications for each slot (example logic, adjust as needed)
  useEffect(() => {
    const fetchMagnifications = async () => {
      try {
        const mag1 = await apiObjectiveControllerGetCurrentObjective(1);
        const mag2 = await apiObjectiveControllerGetCurrentObjective(2);
        setMagnifications({ 1: mag1[1], 2: mag2[1]});
      } catch (e) {
        console.error("Error fetching magnifications", e);
      }
    };
    fetchMagnifications();
  }, []);

  /* --- switcher --- */
  const switchTo = async (slot) => {
    try {
      await apiObjectiveControllerMoveToObjective(slot);
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
            {objectiveState.currentObjective != null ? `Slot ${objectiveState.currentObjective}` : "—"}{" "}
            {objectiveState.objectivName && `(${objectiveState.objectivName})`}
          </Typography>
          <Typography sx={{ fontSize: "0.9rem" }}>
            {objectiveState.magnification != null && `Mag: ${objectiveState.magnification}×  • `}
            {objectiveState.NA != null && `NA ${objectiveState.NA}  • `}
            {objectiveState.pixelsize != null && `Pixel ${objectiveState.pixelsize} µm`}
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
                 Switch to Objective 1{" "}
                  {magnifications[1] != null && `(Mag: ${magnifications[1]}×)`}

              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                color={currentSlot === 2 ? "secondary" : "primary"}
                onClick={() => switchTo(2)}
              >
                Switch to Objective 1{" "}
                {magnifications[2] != null && `(Mag: ${magnifications[2]}×)`}

              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}

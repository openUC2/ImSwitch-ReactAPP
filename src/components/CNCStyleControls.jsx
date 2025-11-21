import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Chip,
  Stack,
  Divider,
  Paper,
  ButtonGroup,
  Tooltip,
} from "@mui/material";
import { Home, Stop, Speed } from "@mui/icons-material";

/**
 * CNCStyleControls - Traditional CNC machine style controls
 * Consolidated position display and unified step controls
 */
const CNCStyleControls = ({
  hostIP,
  hostPort,
  positionerName,
  positions, // {X: val, Y: val, Z: val, A: val}
}) => {
  // Unified step sizes for all axes
  const [stepSize, setStepSize] = useState(100);
  const [speed, setSpeed] = useState(20000);

  // Absolute target positions
  const [targets, setTargets] = useState({
    X: 0,
    Y: 0,
    Z: 0,
    A: 0,
  });

  // Quick step sizes
  const stepOptions = [
    { value: 0.1, label: "0.1µm", color: "primary" },
    { value: 1, label: "1µm", color: "secondary" },
    { value: 10, label: "10µm", color: "success" },
    { value: 100, label: "100µm", color: "warning" },
    { value: 1000, label: "1000µm", color: "error" },
    { value: 10000, label: "10mm", color: "info" },
  ];

  const call = async (url) => {
    try {
      await fetch(url);
    } catch (e) {
      console.error(e);
    }
  };

  const base = `${hostIP}:${hostPort}/PositionerController`;

  const moveAxis = (axis, distance) =>
    call(
      `${base}/movePositioner?positionerName=${positionerName}` +
        `&axis=${axis}&dist=${distance}&isAbsolute=false&isBlocking=false&speed=${speed}`
    );

  const moveAxisAbs = (axis, target) =>
    call(
      `${base}/movePositioner?positionerName=${positionerName}` +
        `&axis=${axis}&dist=${target}&isAbsolute=true&isBlocking=false&speed=${speed}`
    );

  const homeAxis = (axis) =>
    call(
      `${base}/homeAxis?positionerName=${positionerName}` +
        `&axis=${axis}&isBlocking=false`
    );

  const stopAxis = (axis) =>
    call(`${base}/stopAxis?positionerName=${positionerName}&axis=${axis}`);

  const homeAll = () => {
    ["X", "Y", "Z", "A"].forEach((axis) => homeAxis(axis));
  };

  const stopAll = () => {
    ["X", "Y", "Z", "A"].forEach((axis) => stopAxis(axis));
  };

  const setTargetPosition = (axis, value) => {
    setTargets((prev) => ({ ...prev, [axis]: value }));
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Position Control System
        </Typography>

        {/* Current Positions Display - CNC Style */}
        <Paper
          sx={{
            p: 2,
            mb: 2,
            bgcolor: "background.default",
            border: 1,
            borderColor: "divider",
            color: "text.primary",
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1, color: "success.main" }}>
            CURRENT POSITION (µm)
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(positions).map(([axis, position]) => (
              <Grid item xs={3} key={axis}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    {axis}-AXIS
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: "monospace",
                      color: "success.main",
                      fontWeight: "bold",
                    }}
                  >
                    {(position || 0).toFixed(1)}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Unified Step Size Control */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Movement Step Size
          </Typography>
          <Stack
            direction="row"
            spacing={0.5}
            sx={{ flexWrap: "wrap", gap: 0.5, mb: 1 }}
          >
            {stepOptions.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                size="small"
                color={stepSize === option.value ? option.color : "default"}
                variant={stepSize === option.value ? "filled" : "outlined"}
                onClick={() => setStepSize(option.value)}
                sx={{ cursor: "pointer" }}
              />
            ))}
            <TextField
              size="small"
              type="number"
              value={stepSize}
              onChange={(e) => setStepSize(Number(e.target.value))}
              sx={{ width: 100, ml: 1 }}
              InputProps={{
                style: { fontSize: "0.8rem" },
                endAdornment: <Typography variant="caption">µm</Typography>,
              }}
            />
          </Stack>
        </Box>

        {/* Movement Controls Grid */}
        <Grid container spacing={2}>
          {Object.keys(positions).map((axis) => (
            <Grid item xs={12} sm={6} md={3} key={axis}>
              <Paper
                sx={{
                  p: 1.5,
                  bgcolor: "background.paper",
                  border: 1,
                  borderColor: "divider",
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    textAlign: "center",
                    fontWeight: "bold",
                    mb: 1,
                    color: "primary.main",
                  }}
                >
                  {axis} Axis
                </Typography>

                {/* Relative Movement */}
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={() => moveAxis(axis, -stepSize)}
                    sx={{ flex: 1, fontSize: "0.7rem" }}
                  >
                    -{stepSize}
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={() => moveAxis(axis, +stepSize)}
                    sx={{ flex: 1, fontSize: "0.7rem" }}
                  >
                    +{stepSize}
                  </Button>
                </Stack>

                {/* Absolute Position Input */}
                <TextField
                  label="Target"
                  size="small"
                  type="number"
                  value={targets[axis]}
                  onChange={(e) =>
                    setTargetPosition(axis, Number(e.target.value))
                  }
                  fullWidth
                  sx={{ mb: 1 }}
                  InputProps={{
                    style: { fontSize: "0.8rem" },
                    endAdornment: <Typography variant="caption">µm</Typography>,
                  }}
                />

                {/* Control Buttons */}
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Move to target">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => moveAxisAbs(axis, targets[axis])}
                      sx={{ flex: 1, fontSize: "0.7rem" }}
                    >
                      GO
                    </Button>
                  </Tooltip>
                  <Tooltip title="Home axis">
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="small"
                      onClick={() => homeAxis(axis)}
                      sx={{ flex: 1, fontSize: "0.7rem" }}
                    >
                      HOME
                    </Button>
                  </Tooltip>
                  <Tooltip title="Stop axis">
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => stopAxis(axis)}
                      sx={{ flex: 1, fontSize: "0.7rem" }}
                    >
                      STOP
                    </Button>
                  </Tooltip>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Global Controls */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <TextField
            label="Speed"
            type="number"
            size="small"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            sx={{ width: 150 }}
            InputProps={{
              startAdornment: <Speed fontSize="small" sx={{ mr: 0.5 }} />,
              style: { fontSize: "0.8rem" },
            }}
          />

          <ButtonGroup variant="contained" size="small">
            <Button color="secondary" onClick={homeAll} startIcon={<Home />}>
              HOME ALL
            </Button>
            <Button color="error" onClick={stopAll} startIcon={<Stop />}>
              STOP ALL
            </Button>
          </ButtonGroup>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CNCStyleControls;

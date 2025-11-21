import {
  Button,
  Stack,
  TextField,
  Typography,
  Card,
  CardContent,
  Chip,
  Box,
  Tooltip,
  Divider,
} from "@mui/material";
import React, { useState } from "react";
import {
  Add,
  Remove,
  Home,
  Stop,
  MyLocation,
  Speed,
} from "@mui/icons-material";

/**
 * ResponsiveAxisControl - Modern, responsive axis control component
 * Designed to work well on all screen sizes without layout breaking
 */
const ResponsiveAxisControl = ({
  axisLabel, // "X", "Y", "Z" …
  hostIP, // e.g. "http://192.168.4.10"
  hostPort, // e.g. 8000
  positionerName, // backend name
  mPosition, // live position value
}) => {
  const [relStep, setRelStep] = useState(1000);
  const [absTarget, setAbsTarget] = useState(0);
  const [speed, setSpeed] = useState(20000);

  // Quick step sizes
  const quickSteps = [1, 10, 100, 1000, 10000];

  const call = async (url) => {
    try {
      await fetch(url);
    } catch (e) {
      console.error(e);
    }
  };

  const base = `${hostIP}:${hostPort}/PositionerController`;

  const moveRel = (d) =>
    call(
      `${base}/movePositioner?positionerName=${positionerName}` +
        `&axis=${axisLabel}&dist=${d}&isAbsolute=false&isBlocking=false&speed=${speed}`
    );

  const moveAbs = () =>
    call(
      `${base}/movePositioner?positionerName=${positionerName}` +
        `&axis=${axisLabel}&dist=${absTarget}&isAbsolute=true&isBlocking=false&speed=${speed}`
    );

  const homeAxis = () =>
    call(
      `${base}/homeAxis?positionerName=${positionerName}` +
        `&axis=${axisLabel}&isBlocking=false`
    );

  const stopAxis = () =>
    call(`${base}/stopAxis?positionerName=${positionerName}&axis=${axisLabel}`);

  const getStepColor = (step) => {
    if (step === 1) return "primary";
    if (step === 10) return "secondary";
    if (step === 100) return "success";
    if (step === 1000) return "warning";
    return "error";
  };

  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Typography
            variant="h6"
            component="span"
            sx={{
              bgcolor: "primary.main",
              color: "primary.contrastText",
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              minWidth: 32,
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            {axisLabel}
          </Typography>

          <TextField
            label="Current Position (µm)"
            type="number"
            size="small"
            variant="filled"
            value={mPosition || 0}
            inputProps={{ readOnly: true, style: { textAlign: "right" } }}
            sx={{ ml: 2, flex: 1, maxWidth: 200 }}
          />
        </Box>

        {/* Relative Movement Section */}
        <Stack spacing={2}>
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, color: "text.secondary" }}
            >
              Relative Movement
            </Typography>

            {/* Quick Step Selection */}
            <Box sx={{ display: "flex", gap: 0.5, mb: 1, flexWrap: "wrap" }}>
              <Typography variant="body2" sx={{ alignSelf: "center", mr: 1 }}>
                Step:
              </Typography>
              {quickSteps.map((step) => (
                <Chip
                  key={step}
                  label={`${step}µm`}
                  size="small"
                  color={relStep === step ? getStepColor(step) : "default"}
                  variant={relStep === step ? "filled" : "outlined"}
                  onClick={() => setRelStep(step)}
                  sx={{ cursor: "pointer" }}
                />
              ))}
              <TextField
                type="number"
                size="small"
                value={relStep}
                onChange={(e) => setRelStep(Number(e.target.value))}
                sx={{ width: 80, ml: 1 }}
                InputProps={{ style: { fontSize: "0.8rem" } }}
              />
            </Box>

            {/* Movement Buttons */}
            <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
              <Tooltip title={`Move ${axisLabel} -${relStep}µm`}>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Remove />}
                  onClick={() => moveRel(-relStep)}
                  sx={{ flex: 1, maxWidth: 120 }}
                >
                  -{relStep}
                </Button>
              </Tooltip>

              <Tooltip title={`Move ${axisLabel} +${relStep}µm`}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<Add />}
                  onClick={() => moveRel(+relStep)}
                  sx={{ flex: 1, maxWidth: 120 }}
                >
                  +{relStep}
                </Button>
              </Tooltip>
            </Box>
          </Box>

          <Divider />

          {/* Absolute Movement Section */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, color: "text.secondary" }}
            >
              Absolute Movement
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <TextField
                label="Target Position (µm)"
                type="number"
                size="small"
                variant="outlined"
                value={absTarget}
                onChange={(e) => setAbsTarget(Number(e.target.value))}
                sx={{ flex: 1, minWidth: 150 }}
              />

              <Button
                variant="contained"
                startIcon={<MyLocation />}
                onClick={moveAbs}
                sx={{ minWidth: 80 }}
              >
                Go
              </Button>
            </Box>
          </Box>

          <Divider />

          {/* Control Section */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, color: "text.secondary" }}
            >
              Control & Settings
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <TextField
                label="Speed"
                type="number"
                size="small"
                variant="outlined"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                InputProps={{
                  startAdornment: <Speed fontSize="small" sx={{ mr: 0.5 }} />,
                }}
                sx={{ flex: 1, minWidth: 120, maxWidth: 150 }}
              />

              <Button
                variant="outlined"
                color="secondary"
                startIcon={<Home />}
                onClick={homeAxis}
                sx={{ minWidth: 80 }}
              >
                Home
              </Button>

              <Button
                variant="outlined"
                color="error"
                startIcon={<Stop />}
                onClick={stopAxis}
                sx={{ minWidth: 80 }}
              >
                Stop
              </Button>
            </Box>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default ResponsiveAxisControl;

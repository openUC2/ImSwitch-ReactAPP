import React from "react";
import { Box, Typography } from "@mui/material";
import { Bar } from "react-chartjs-2";

export default function HistogramOverlay({
  active,
  visible,
  x,
  y,
  options,
  dataObj,
}) {
  if (!active || !visible) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        top: 10,
        left: 10,
        width: 200,
        height: 200,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 5,
        p: 1,
      }}
    >
      {x.length && y.length ? (
        <Bar data={dataObj} options={options} />
      ) : (
        <Typography sx={{ color: "#fff" }}>Loading…</Typography>
      )}
    </Box>
  );
}

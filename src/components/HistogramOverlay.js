import React from "react";
import { Box, Typography } from "@mui/material";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function HistogramOverlay({
  active,
  visible,
  x,
  y,
  options,
  dataObj,
}) {
  if (!active || !visible) return null;

  // Debug: Log histogram data availability
  const hasData = x && x.length > 0 && y && y.length > 0;

  return (
    <Box
      sx={{
        position: "absolute",
        top: 10,
        left: 10,
        width: 250,
        height: 200,
        backgroundColor: "rgba(0,0,0,0.7)",
        zIndex: 5,
        p: 1,
        borderRadius: 1,
      }}
    >
      {hasData ? (
        <Bar data={dataObj} options={options} />
      ) : (
        <Typography sx={{ color: "#fff", fontSize: "12px" }}>
          Waiting for histogram data...
          <br />
          <Typography sx={{ color: "#888", fontSize: "10px", mt: 1 }}>
            x: {x?.length || 0} bins
            <br />
            y: {y?.length || 0} values
          </Typography>
        </Typography>
      )}
    </Box>
  );
}

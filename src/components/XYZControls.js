import { Box, Checkbox, Slider, Typography, Paper, Grid } from "@mui/material";
import React, { useEffect, useState } from "react";
import AxisControl from "./AxisControl";
import { useWebSocket } from "../context/WebSocketContext";

function XYZControls({ hostIP, hostPort }) {
  const [positionerName, setPositionerName] = useState("");
  const [positions, setPositions] = useState({});
  const socket = useWebSocket();

  /* --- websocket updates --- */
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      try {
        const j = JSON.parse(data);
        if (j.name === "sigUpdateMotorPosition") {
          const p = j.args.p0;
          const first = Object.keys(p)[0];
          if (first) setPositions((s) => ({ ...s, ...p[first] }));
        }
      } catch (e) {
        console.error(e);
      }
    };
    socket.on("signal", handler);
    return () => socket.off("signal", handler);
  }, [socket]);

  /* --- initial fetches --- */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${hostIP}:${hostPort}/PositionerController/getPositionerNames`);
        const d = await r.json();
        setPositionerName(d[0]);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [hostIP, hostPort]);

  useEffect(() => {
    if (!positionerName) return;
    (async () => {
      try {
        const r = await fetch(`${hostIP}:${hostPort}/PositionerController/getPositionerPositions`);
        const d = await r.json();
        if (d[positionerName]) setPositions(d[positionerName]);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [positionerName, hostIP, hostPort]);

  /* --- layout: stack controllers vertically --- */
  return (
        <Paper sx={{ p: 2 }}>

    <Grid container direction="column" spacing={2}>
      {Object.keys(positions).map((axis) => (
        <Grid item key={axis}>
          <AxisControl
            axisLabel={axis}
            hostIP={hostIP}
            hostPort={hostPort}
            positionerName={positionerName}
            mPosition={positions[axis]}
          />
        </Grid>
      ))}
    </Grid>
    </Paper>

  );
}

export default XYZControls;

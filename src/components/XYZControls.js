import { Grid } from "@mui/material";
import React, { useEffect, useState } from "react";
import AxisControl from "./AxisControl";
import { useWebSocket } from "../context/WebSocketContext";

function XYZControls({ hostIP, hostPort }) {
  const [positionerName, setPositionerName] = useState("");
  const [positions, setPositions] = useState({});
  const socket = useWebSocket();

  useEffect(() => {
    if (!socket) return;

    const handleSignal = (data) => {
      try {
        const jdata = JSON.parse(data);
        if (jdata.name === "sigUpdateMotorPosition") {
          const parsedArgs = jdata.args.p0;
          const positionerKeys = Object.keys(parsedArgs);  

          if (positionerKeys.length > 0) {
            const key = positionerKeys[0];
            const correctedPositions = parsedArgs[key];

            setPositions((prevPositions) => ({
              ...prevPositions,
              ...correctedPositions,
            }));
          }
        }
      } catch (error) {
        console.error("Error parsing signal data:", error);
      }
    };

    socket.on("signal", handleSignal);
    return () => {
      socket.off("signal", handleSignal);
    };
  }, [socket]);

  const getPositionerName = async () => {
    try {
      const response = await fetch(
        `${hostIP}:${hostPort}/PositionerController/getPositionerNames`
      );
      const data = await response.json();
      setPositionerName(data[0]);
    } catch (error) {
      console.error("Error fetching positioner name:", error);
    }
  };

  const fetchPositions = async () => {
    try {
      const response = await fetch(
        `${hostIP}:${hostPort}/PositionerController/getPositionerPositions`
      );
      const data = await response.json();

      if (data[positionerName]) {
        setPositions(data[positionerName]);
      }
    } catch (error) {
      console.error("Error fetching positioner positions:", error);
    }
  };

  useEffect(() => {
    getPositionerName();
  }, [hostIP, hostPort]);

  useEffect(() => {
    if (positionerName) {
      fetchPositions();
    }
  }, [positionerName]);

  return (
    <Grid container spacing={10}>
      {Object.keys(positions).map((axisLabel) => (
        <Grid item xs={3} key={axisLabel}>
          <AxisControl
            axisLabel={axisLabel}
            hostIP={hostIP}
            hostPort={hostPort}
            positionerName={positionerName}
            mPosition={positions[axisLabel]}
          />
        </Grid>
      ))}
    </Grid>
  );
}

export default XYZControls;

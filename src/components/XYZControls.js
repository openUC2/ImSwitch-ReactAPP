import { Grid } from "@mui/material";
import React, { useEffect, useState } from "react";
import AxisControl from "./AxisControl";
import { useWebSocket } from "../context/WebSocketContext";

function XYZControls({ hostIP, hostPort }) {
  const socket = useWebSocket();
  const [positionerName, setPositionerName] = useState("VirtualStage"); // Assume a default or initial value
  const [positions, setPositions] = useState({A:0, X: 0, Y: 0, Z: 0 });

  useEffect(() => {
    getPositionerName();
    fetchPositions();
  }, []);

  const getPositionerName = async () => {
    try {
      const response = await fetch(
        `${hostIP}:${hostPort}/PositionerController/getPositionerNames`
      );
      const data = await response.json();
      setPositionerName(data[0]);  // Assume first element if multiple names are returned
    } catch (error) {
      console.error("Error fetching positioner name:", error);
    }
  };

  const fetchPositions = async () => {
    /*
    * The fetch() function is used to make a request to the server to get the current positions of the positioner.
    * The response is then converted to JSON format and the positions are set in the state using the setPositions() function.
    * The positions are stored in an object with keys 'A', 'X', 'Y', and 'Z' representing the different axes of the positioner.
    * The positionerName variable is used to specify the positioner for which the positions are being fetched.
    * The hostIP and hostPort variables are used to construct the URL for the fetch request.
    */
    try {
      const response = await fetch(
        `${hostIP}:${hostPort}/PositionerController/getPositionerPositions`
      );
      const data = await response.json();

      setPositions({
        A: data[positionerName].A || 0,
        X: data[positionerName].X || 0,
        Y: data[positionerName].Y || 0,
        Z: data[positionerName].Z || 0,
      });
    } catch (error) {
      console.error("Error fetching positioner positions:", error);
    }
  };

  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.name === "sigUpdateMotorPosition") {
            const correctedPositions = JSON.parse(data.args.p0.replace(/'/g, '"'))[positionerName];
            setPositions((prevPositions) => ({
              ...prevPositions,
              ...correctedPositions,
            }));
          }
        } catch (error) {
          console.error("Error parsing the socket message:", error);
        }
      };
    }

    return () => {
      if (socket) socket.onmessage = null;
    };
  }, [socket]);

  return (
    <Grid container spacing={5}>
      {["X", "Y", "Z", "A"].map((axisLabel) => (
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

import { Grid } from "@mui/material";
import React, { useEffect, useState } from "react";
import AxisControl from "./AxisControl";
import { useWebSocket } from "../context/WebSocketContext";

function XYZControls({ hostIP, hostPort }) {
  const [positionerName, setPositionerName] = useState(""); // TODO: We should put most states in the contextmanager
  const [positions, setPositions] = useState({A:0, X: 0, Y: 0, Z: 0 });
  const socket = useWebSocket();


  useEffect(() => {
    if (!socket) return;

    const handleSignal = (data) => {
      console.log("Signal received in XYZControls:", data);
      
      try {
        const jdata = JSON.parse(data);
        if (jdata.name === "sigUpdateMotorPosition") {
          // Parse args.p0 und ersetze einfache Anführungszeichen durch doppelte
          const parsedArgs = JSON.parse(jdata.args.p0.replace(/'/g, '"'));
          
          // Extrahiere alle Positioner-Namen (z.B. ESP32Stage)
          const positionerKeys = Object.keys(parsedArgs);
          
          if (positionerKeys.length > 0) {
            const key = positionerKeys[0]; // Nimm den ersten Schlüssel
            const correctedPositions = parsedArgs[key];
            
            console.log(`Corrected positions for ${key}:`, correctedPositions);
            
            setPositions((prevPositions) => ({
              ...prevPositions,
              ...correctedPositions,
            }));
          } else {
            console.warn("No positioner data found in the signal.");
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
      
      console.log("Fetched Positions from positionerName ", positionerName, ":", data[positionerName]);
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
  
  // useEffect() hook to fetch the positioner name and positions when the component mounts
  useEffect(() => {
    console.log("Fetching positioner name and positions...");
    getPositionerName();
  }, [hostIP, hostPort]);
  
  // useEffect() hook to fetch the positions when the positionerName changes
  useEffect(() => {
    if (positionerName) {
      fetchPositions(positionerName);
    }
  }, [positionerName]);


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

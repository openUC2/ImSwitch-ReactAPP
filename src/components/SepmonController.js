import React, { useState, useEffect } from "react";
import {
  Paper,
  Button,
  Typography,
  Switch,
  TextField,
  Grid,
} from "@mui/material";
// ggf. weitere MUI-Komponenten wie Slider, IconButton etc.

import { useWebSocket } from "../context/WebSocketContext"; // Beispiel: eigener WebSocket-Context

export default function LepmonController({ hostIP, hostPort }) {
  // States
  const [isRunning, setIsRunning] = useState(false);
  const [currentImageCount, setCurrentImageCount] = useState(0);
  const [serverTime, setServerTime] = useState("");
  const [deviceTime, setDeviceTime] = useState("");
  const [insideTemp, setInsideTemp] = useState(null);
  const [outsideTemp, setOutsideTemp] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [freeSpace, setFreeSpace] = useState("");
  const [storagePath, setStoragePath] = useState("");
  const [sharpnessValue, setSharpness] = useState(null);

  // Kameraeinstellungen
  const [exposure, setExposure] = useState(100);
  const [gain, setGain] = useState(0);
  const [timelapsePeriod, setTimelapsePeriod] = useState(60); // Bsp: 60 Sekunden
  const [timelapseLocked, setTimelapseLocked] = useState(true);
  const [rebootLocked, setRebootLocked] = useState(true);

  // GPS (vom Gerät des Users - sofern möglich: via Geolocation-API)
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  // Zeit und Datum
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  // WebSocket
  const socket = useWebSocket(); // Context, der `socket` zur Verfügung stellt

  // Beim ersten Laden: Initial-Daten per REST holen
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const urlStatus = `${hostIP}:${hostPort}/LepmonController/getStatus`;
        const resStatus = await fetch(urlStatus);
        const statusData = await resStatus.json();
        setIsRunning(statusData.isRunning);
        setCurrentImageCount(statusData.currentImageCount);
        setServerTime(statusData.serverTime);
        setFreeSpace(statusData.freeSpace);

        // 2. Hole Kamera-/Timelapse-Einstellungen
        const urlInitialParams = `${hostIP}:${hostPort}/LepmonController/getInitialParams`;
        const resParams = await fetch(urlInitialParams);
        const paramsData = await resParams.json();
        setExposure(paramsData.exposureTime);
        setGain(paramsData.gain);
        setTimelapsePeriod(paramsData.timelapsePeriod);
        setStoragePath(paramsData.storagePath);
      } catch (err) {
        console.error("Fehler beim Laden der Initialdaten:", err);
      }
    }
    fetchInitialData();

    // Versuche, Client-GPS zu ermitteln (optional)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
        },
        (err) => {
          console.warn("GPS nicht verfügbar:", err);
          // set default values of Jena
          setLat(50.928014);
          setLng(11.589237);
        },
        { enableHighAccuracy: true }
      );
    }

    // Setze die aktuelle Zeit und das Datum
    const now = new Date();
    setTime(now.toTimeString().slice(0, 8)); // HH:MM:SS
    setDate(now.toISOString().slice(0, 10)); // YYYY-MM-DD
  }, []);

  // WebSocket-Ereignisse
  useEffect(() => {
    if (!socket) return;

    socket.on("signal", (msg) => {
      // msg = JSON.stringify(...) vom Server => parsen
      const data = JSON.parse(msg);
      switch (data.name) {
        case "sigImagesTaken":
          setCurrentImageCount(data.args.p0);
          break;
        case "temperatureUpdate":
            const _args = JSON.parse(data.args.p0.replace(/'/g, '"'));
            setInsideTemp(_args.innerTemp);
            setOutsideTemp(_args.outerTemp);
            setHumidity(_args.humidity);
          break;
        case "freeSpaceUpdate":
            const _argsFreeSpace = JSON.parse(data.args.p0.replace(/'/g, '"'));
          setFreeSpace(_argsFreeSpace.freeSpace);
          break;
        case "sigFocusSharpness":
          console.log("Fokus-Wert:", data.args.p0);
          setSharpness(data.args.p0);
          break;
        case "serverTime":
          setServerTime(data.value);
          break;
        default:
          console.log("Unbekannter msgType:", data.msgType);
          break;
      }
    });

    // Cleanup if needed
    return () => {
      socket.off("message");
    };
  }, [socket]);

  // Experiment Start / Stop
  const handleStart = async () => {
    // ggf. Client-Zeit und GPS hochladen
    const userTime = new Date().toISOString();
    setDeviceTime(userTime);
  
    const params = new URLSearchParams({
      deviceTime: userTime,
      deviceLat: lat,
      deviceLng: lng,
      exposureTime: exposure,
      gain: gain,
      timelapsePeriod: timelapsePeriod,
      time: time,
      date: date,
    });
  
    try {
      const urlStart = `${hostIP}:${hostPort}/LepmonController/startExperiment?${params.toString()}`;
      const res = await fetch(urlStart, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        setIsRunning(true);
      }
    } catch (err) {
      console.error("Fehler beim Starten:", err);
    }
  };

  const handleStop = async () => {
    try {
      const urlStop = `${hostIP}:${hostPort}/LepmonController/stopExperiment`;
      const res = await fetch(urlStop, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setIsRunning(false);
      }
    } catch (err) {
      console.error("Fehler beim Stoppen:", err);
    }
  };

  // Fokusmodus
  const handleFocus = async () => {
    try {
      const urlFocus = `${hostIP}:${hostPort}/LepmonController/focusMode`;
      const res = await fetch(urlFocus, { method: "POST" });
      // Backend startet 15s-Fokusmodus => sendet "focusSharpness" als WS
    } catch (err) {
      console.error("Fehler beim Fokus:", err);
    }
  };

  // Reboot
  const handleReboot = async () => {
    // z. B. mit Confirm-Dialog
    try {
      const urlReboot = `${hostIP}:${hostPort}/LepmonController/reboot`;
      const res = await fetch(urlReboot, { method: "POST" });
    } catch (err) {
      console.error("Reboot-Error:", err);
    }
  };

  return (
    <Paper style={{ padding: 20 }}>
      <Typography variant="h5">LepMon Controller</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography>
            Aktueller Status: {isRunning ? "Läuft" : "Gestoppt"}
          </Typography>
          <Typography>Aufgenommene Bilder: {currentImageCount}</Typography>
          <Typography>Freier Speicher: {freeSpace}</Typography>
          <Typography>Speicherpfad: {storagePath}</Typography>
          <Typography>Serverzeit: {serverTime}</Typography>
          <Typography>
            Inside Temp: {insideTemp} °C / Outside Temp: {outsideTemp} °C /
            Humidity: {humidity} %
          </Typography>
        </Grid>

        <Grid item xs={6}>
          <TextField
            label="Exposure"
            value={exposure}
            onChange={(e) => setExposure(e.target.value)}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Gain"
            value={gain}
            onChange={(e) => setGain(e.target.value)}
          />
        </Grid>

        <Grid item xs={6}>
          <Typography>Timelapse Period (Sekunden)</Typography>
          <Switch
            checked={!timelapseLocked}
            onChange={() => setTimelapseLocked(!timelapseLocked)}
          />
          <TextField
            disabled={timelapseLocked}
            value={timelapsePeriod}
            onChange={(e) => setTimelapsePeriod(e.target.value)}
          />
        </Grid>

        <Grid item xs={6}>
          <Typography>Timelapse Period (Sekunden)</Typography>
          <Switch
            checked={!rebootLocked}
            onChange={() => setRebootLocked(!rebootLocked)}
          />
          <Button
            disabled={rebootLocked}
            variant="contained"
            onClick={handleReboot}
            style={{ marginLeft: 10 }}
          >
            Reboot
          </Button>
        </Grid>

        <Grid item xs={6}>
          <TextField
            label="Latitude"
            value={lat || ""}
            onChange={(e) => setLat(e.target.value)}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Longitude"
            value={lng || ""}
            onChange={(e) => setLng(e.target.value)}
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            label="Time (HH:MM:SS)"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Date (YYYY-MM-DD)"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          
        </Grid>

        <Grid item xs={12}>
            <Button variant="contained" color="primary" onClick={handleFocus}>
                Focus
            </Button>
            {sharpnessValue && (
                <Typography>Sharpness: {sharpnessValue}</Typography>
            )}  
        </Grid>

        <Grid item xs={12} style={{ marginTop: 20 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleStart}
            disabled={isRunning}
          >
            Start Experiment
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleStop}
            disabled={!isRunning}
            style={{ marginLeft: 10 }}
          >
            Stop Experiment
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}

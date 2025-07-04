import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Checkbox,
  FormControlLabel,
  Tabs,
  Tab,
  Typography,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";
import XYZControls from "./XYZControls";
import AutofocusController from "./AutofocusController";
import DetectorParameters from "./DetectorParameters";
import StreamControls from "./StreamControls";
import IlluminationController from "./IlluminationController";
import { useWebSocket } from "../context/WebSocketContext";
import ObjectiveSwitcher from "./ObjectiveSwitcher";
import DetectorTriggerController from "./DetectorTriggerController";
import * as liveViewSlice from "../state/slices/LiveViewSlice.js";
import * as liveStreamSlice from "../state/slices/LiveStreamSlice.js";
import LiveViewControlWrapper from "../axon/LiveViewControlWrapper.js";

/*
<ImageViewport
            detectors={detectors}
            activeTab={activeTab}
            imageUrls={imageUrls}
            pollImageUrl={pollImageUrl}
            showHistogram={showHistogram}
            histogramActive={histogramActive}
            histogramX={histogramX}
            histogramY={histogramY}
            histogramData={histogramData}
            chartOptions={chartOptions}
            pixelSize={pixelSize}
            minVal={minVal}
            maxVal={maxVal}
            onRangeChange={handleRangeChange}
            onRangeCommit={handleRangeCommit}
            onMove={moveStage}
          />*/

const appBarHeight = 64;

export default function LiveView({ hostIP, hostPort, drawerWidth, setFileManagerInitialPath }) {
  // Redux dispatcher
  const dispatch = useDispatch();
  
  // Access global Redux state
  const liveViewState = useSelector(liveViewSlice.getLiveViewState);
  const liveStreamState = useSelector(liveStreamSlice.getLiveStreamState);
  
  const socket = useWebSocket();

  // Use Redux state instead of local state
  const detectors = liveViewState.detectors;
  const activeTab = liveViewState.activeTab;
  const imageUrls = liveViewState.imageUrls;
  const pollImageUrl = liveViewState.pollImageUrl;
  const pixelSize = liveViewState.pixelSize;
  const isStreamRunning = liveViewState.isStreamRunning;
  
  // Keep some local state for now (these may need their own slices later)
  const [isRecording, setIsRecording] = useState(false);
  const [histogramActive, setHistogramActive] = useState(false);
  const [minVal, setMinVal] = useState(0);
  const [maxVal, setMaxVal] = useState(255);
  const [lastSnapPath, setLastSnapPath] = useState("");
  const [compressionRate, setCompressionRate] = useState(80);

  // Stage control tabs state
  const [stageControlTab, setStageControlTab] = useState(0); // 0 = Multiple Axis View, 1 = Joystick Control
  
  // Joystick control states
  const [stepSizeXY, setStepSizeXY] = useState(100);
  const [stepSizeZ, setStepSizeZ] = useState(10);
  const [positionerName, setPositionerName] = useState("");

  /* socket */
  useEffect(() => {
    if (!socket) return;
    const handler = (d) => {
      const j = JSON.parse(d);
      if (j.name === "sigUpdateImage") {
        const det = j.detectorname;
        dispatch(liveViewSlice.setImageUrls({
          ...imageUrls,
          [det]: `data:image/jpeg;base64,${j.image}`,
        }));
        if (j.pixelsize) dispatch(liveViewSlice.setPixelSize(j.pixelsize));
      }
      // Note: sigHistogramComputed is now handled in WebSocketHandler
    };
    socket.on("signal", handler);
    return () => socket.off("signal", handler);
  }, [socket]);

  /* detectors */
  useEffect(() => {
    (async () => {
      try {
        // 'getDetectorNames' must return something array-like
        const r = await fetch(
          `${hostIP}:${hostPort}/SettingsController/getDetectorNames`
        );
        const data = await r.json();
        // Check if data is an array before setting state
        if (Array.isArray(data)) {
          dispatch(liveViewSlice.setDetectors(data));
        } else {
          console.error("getDetectorNames returned non-array:", data);
          dispatch(liveViewSlice.setDetectors([]));
        }
      } catch (error) {
        console.error("Failed to fetch detectors:", error);
        dispatch(liveViewSlice.setDetectors([]));
      }
    })();
  }, [hostIP, hostPort]);

  /* positioner name for joystick */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${hostIP}:${hostPort}/PositionerController/getPositionerNames`);
        const d = await r.json();
        if (d && d.length > 0) {
          setPositionerName(d[0]);
        }
      } catch (e) {
        console.error("Failed to fetch positioner names:", e);
      }
    })();
  }, [hostIP, hostPort]);

  /* histogram availability */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(
          `${hostIP}:${hostPort}/HistogrammController/histogrammActive`
        );
        setHistogramActive(r.status !== 404);
      } catch {
        setHistogramActive(false);
      }
    })();
  }, [hostIP, hostPort]);

  /* min/max */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(
          `${hostIP}:${hostPort}/HistogrammController/minmaxvalues`
        );
        if (!r.ok) return;
        const d = await r.json();
        setMinVal(d.minVal);
        setMaxVal(d.maxVal);
      } catch {}
    })();
  }, [hostIP, hostPort]);

  /* poll second detector */
  useEffect(() => {
    if (activeTab === 1 && detectors.length > 1) {
      const id = setInterval(async () => {
        try {
          const res = await fetch(
            `${hostIP}:${hostPort}/HistoScanController/getPreviewCameraImage?resizeFactor=1`
          );
          if (res.ok) dispatch(liveViewSlice.setPollImageUrl(URL.createObjectURL(await res.blob())));
        } catch {}
      }, 1000);
      return () => clearInterval(id);
    }
  }, [activeTab, detectors, hostIP, hostPort]);

  /* check if stream is running */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(
          `${hostIP}:${hostPort}/ViewController/getLiveViewActive`
        );
        if (r.status === 200) {
          const data = await r.json();
          dispatch(liveViewSlice.setIsStreamRunning(data.active));
        }
      } catch {}
    })();
  }, [hostIP, hostPort, activeTab, dispatch]);

  // Fetch the current compression rate from backend once
  useEffect(() => {
    const fetchCompressionRate = async () => {
      try {
        const res = await fetch(
          `${hostIP}:${hostPort}/SettingsController/getDetectorGlobalParameters`
        );
        if (res.ok) {
          const data = await res.json();
          if (typeof data.compressionlevel === "number") {
            setCompressionRate(data.compressionlevel);
          }
        }
      } catch (err) {
        console.error("Failed to fetch compression rate:", err);
      }
    };
    fetchCompressionRate();
  }, []);

  // Update local state and backend whenever the user changes the rate
  const handleCompressionChange = async (e) => {
    const val = Number(e.target.value);
    setCompressionRate(val);
    try {
      await fetch(
        `${hostIP}:${hostPort}/SettingsController/setDetectorCompressionrate?compressionrate=${val}`
      );
    } catch (err) {
      console.error("Failed to set compression rate:", err);
    }
  };

  /* handlers */
  const handleRangeChange = (e, v) => {
    setMinVal(v[0]);
    setMaxVal(v[1]);
  };
  // Note: Backend intensity scaling removed - now handled in frontend
  const handleRangeCommit = async (e, v) => {
    // Frontend-only intensity scaling - no backend call needed
    console.log("Intensity range updated in frontend:", v);
  };
  const toggleStream = async () => {
    const n = !isStreamRunning;
    try {
      await fetch(
        `${hostIP}:${hostPort}/ViewController/setLiveViewActive?active=${n}`
      );
    } catch {}
    dispatch(liveViewSlice.setIsStreamRunning(n));
  };
  async function snap() {
    // English comment: Example fetch for snapping an image
    const response = await fetch(
      `${hostIP}:${hostPort}/RecordingController/snapImageToPath?fileName=openUC2_snapshot`
    );
    const data = await response.json();
    // data.relativePath might be "recordings/2025_05_20-11-12-44_PM"
    setLastSnapPath(`/${data.relativePath}`); // prepend slash
  }
  function handleGoToImage() {
    if (lastSnapPath) {
      setFileManagerInitialPath(lastSnapPath);
    }
  }
  const startRec = async () => {
    setIsRecording(true);
    fetch(
      `${hostIP}:${hostPort}/RecordingController/startRecording?mSaveFormat=4`
    ).catch(() => {});
  };
  const stopRec = async () => {
    setIsRecording(false);
    fetch(`${hostIP}:${hostPort}/RecordingController/stopRecording`).catch(
      () => {}
    );
  };
  const moveStage = async (dir) => {
    const map = {
      up: { axis: "Y", dist: 1000 },
      down: { axis: "Y", dist: -1000 },
      left: { axis: "X", dist: 1000 },
      right: { axis: "X", dist: -1000 },
    };
    const { axis, dist } = map[dir];
    fetch(
      `${hostIP}:${hostPort}/PositionerController/movePositioner?axis=${axis}&dist=${dist}&isAbsolute=false&isBlocking=false`
    ).catch(() => {});
  };

  // Joystick movement functions
  const moveJoystickStage = (axis, distance) => {
    fetch(
      `${hostIP}:${hostPort}/PositionerController/movePositioner?axis=${axis}&dist=${distance}&isAbsolute=false&isBlocking=false`
    )
      .then((res) => res.json())
      .catch(console.error);
  };

  const homeAxis = (axis) => {
    if (!positionerName) {
      console.error("No positioner name available for homing");
      return;
    }
    fetch(
      `${hostIP}:${hostPort}/PositionerController/homeAxis?positionerName=${positionerName}&axis=${axis}&isBlocking=false`
    )
      .then((res) => res.json())
      .catch(console.error);
  };

  const homeAll = () => {
    if (!positionerName) {
      console.error("No positioner name available for homing");
      return;
    }
    ["X", "Y", "Z"].forEach(axis => homeAxis(axis));
  };

  // Joystick click handlers
  const handleJoystickClick = (direction, stepSize) => {
    switch (direction) {
      case "Y+":
        moveJoystickStage("Y", stepSize);
        break;
      case "Y-":
        moveJoystickStage("Y", -stepSize);
        break;
      case "X+":
        moveJoystickStage("X", stepSize);
        break;
      case "X-":
        moveJoystickStage("X", -stepSize);
        break;
      case "Z+":
        moveJoystickStage("Z", stepSizeZ);
        break;
      case "Z-":
        moveJoystickStage("Z", -stepSizeZ);
        break;
      default:
        console.log("Unknown direction:", direction);
    }
  };

  return (
    <Box
      sx={{
        position: "absolute",
        top: appBarHeight,
        left: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        height: `calc(100vh - ${appBarHeight}px)`,
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/* LEFT */}
      <Box sx={{ width: "60%", height: "100%", p: 2, boxSizing: "border-box" }}>
        {/* Snap controls with editable file name */}
        <Box sx={{ display: "flex", gap: 1, mb: 2, alignItems: "center" }}>
          {/* Keep StreamControls for other controls */}
          <StreamControls
            isStreamRunning={isStreamRunning}
            onToggleStream={toggleStream}
            onSnap={snap}
            isRecording={isRecording}
            onStartRecord={startRec}
            onStopRecord={stopRec}
            onGoToImage={handleGoToImage}
            lastSnapPath={lastSnapPath}
            compressionRate={compressionRate}
            setCompressionRate={handleCompressionChange}
          />
        </Box>

        <DetectorParameters hostIP={hostIP} hostPort={hostPort} />

        {histogramActive && (
          <FormControlLabel
            control={
              <Checkbox
                checked={liveStreamState.showHistogram}
                onChange={(e) => dispatch(liveStreamSlice.setShowHistogram(e.target.checked))}
              />
            }
            label="Show Histogram Overlay"
          />
        )}

        <Tabs
          value={activeTab}
          onChange={(_, v) => dispatch(liveViewSlice.setActiveTab(v))}
          sx={{ mt: 2 }}
        >
          {detectors.map((d) => (
            <Tab key={d} label={d} />
          ))}
        </Tabs>

        <Box sx={{ width: "100%", height: "calc(100% - 140px)", mt: 1 }}>
          <LiveViewControlWrapper/>
          
        </Box>
      </Box>

      {/* RIGHT */}
      <Box sx={{ width: "40%", height: "100%", overflowY: "auto", p: 2 }}>
        <Box mb={3}>
          <Typography variant="h6">Stage Control</Typography>
          
          {/* Stage Control Tabs */}
          <Tabs
            value={stageControlTab}
            onChange={(_, v) => setStageControlTab(v)}
            sx={{ mb: 2 }}
          >
            <Tab label="Multiple Axis View" />
            <Tab label="Joystick Control" />
          </Tabs>

          {/* Multiple Axis View */}
          {stageControlTab === 0 && (
            <XYZControls hostIP={hostIP} hostPort={hostPort} />
          )}

          {/* Joystick Control */}
          {stageControlTab === 1 && (
            <Card>
              <CardContent>
                {/* Step Size Controls */}
                <Grid container spacing={2} style={{ marginBottom: "20px" }}>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>XY Step Size</InputLabel>
                      <Select
                        value={stepSizeXY}
                        onChange={(e) => setStepSizeXY(e.target.value)}
                        label="XY Step Size"
                      >
                        <MenuItem value={1000}>1000 µm</MenuItem>
                        <MenuItem value={100}>100 µm</MenuItem>
                        <MenuItem value={10}>10 µm</MenuItem>
                        <MenuItem value={1}>1 µm</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Z Step Size</InputLabel>
                      <Select
                        value={stepSizeZ}
                        onChange={(e) => setStepSizeZ(e.target.value)}
                        label="Z Step Size"
                      >
                        <MenuItem value={100}>100 µm</MenuItem>
                        <MenuItem value={10}>10 µm</MenuItem>
                        <MenuItem value={1}>1 µm</MenuItem>
                        <MenuItem value={0.1}>0.1 µm</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* SVG Joystick */}
                <Box display="flex" justifyContent="center" marginTop={2}>
                  <svg width="320" height="260" viewBox="0 0 320 260" xmlns="http://www.w3.org/2000/svg" style={{ border: "1px solid #ccc" }}>
                    <defs>
                      <style>
                        {`
                          .joyStd { stroke: black; stroke-width: 1; filter: url(#joyF1); cursor: pointer; }
                          .joyStd:hover { fill: orange; }
                          .joyHome { font-family: helvetica; stroke: black; stroke-width: 1; fill: black; font-weight: 900; font-size: 16; pointer-events: none; }
                          .joyScl { font-family: helvetica; stroke: white; stroke-width: 1; fill: white; pointer-events: none; }
                        `}
                      </style>
                      <filter id="joyF1" x="-1" y="-1" width="300%" height="300%">
                        <feOffset result="offOut" in="SourceAlpha" dx="3" dy="3"/>
                        <feGaussianBlur result="blurOut" in="offOut" stdDeviation="4"/>
                        <feBlend in="SourceGraphic" in2="blurOut" mode="normal"/>
                      </filter>
                      <symbol id="HomeIcon" viewBox="0 0 20 18">
                        <path className="joyHome" d="M3,18 v-8 l7,-6 l7,6 v8 h-5 v-6 h-4 v6 z" fill="black"/>
                        <path className="joyHome" d="M0,10 l10-8.5 l10,8.5" strokeWidth="1.5" fill="none"/>
                        <path className="joyHome" d="M15,3 v2.8 l1,.8 v-3.6 z"/>
                      </symbol>
                    </defs>

                    {/* Home All */}
                    <g transform="translate(10, 10)" onClick={() => homeAll()}>
                      <path className="joyStd" d="M10 182.5 h-10 v57.5 h57.5 v-10 a 125,125 0 0,1 -47.5 -47.5 Z" fill="#f0f0f0" />
                      <use x="3" y="217" width="20" height="18" href="#HomeIcon"/>
                    </g>

                    {/* Home X */}
                    <g transform="translate(10, 10)" onClick={() => homeAxis("X")}>
                      <path className="joyStd" d="M10 57.50 h-10 v-57.5 h57.5 v10 a 125,125 0 0,0 -47.5 47.5 Z" fill="Khaki" />
                      <use x="3" y="5" width="20" height="18" href="#HomeIcon"/>
                      <text x="25" y="20" className="joyHome"> X</text>
                    </g>

                    {/* Home Y */}
                    <g transform="translate(10, 10)" onClick={() => homeAxis("Y")}>
                      <path className="joyStd" d="M230 57.50 h10 v-57.5 h-57.5 v10 a 125,125 0 0,1 47.5 47.5 z" fill="SteelBlue" />
                      <use x="217" y="5" width="20" height="18" href="#HomeIcon"/>
                      <text x="202" y="20" className="joyHome"> Y</text>
                    </g>

                    {/* Home Z */}
                    <g transform="translate(10, 10)" onClick={() => homeAxis("Z")}>
                      <path className="joyStd" d="M230 182.5 h10 v57.5 h-57.5 v-10 a 125,125 0 0,0 47.5 -47.5 z" fill="DarkSeaGreen" />
                      <use x="217" y="217" width="20" height="18" href="#HomeIcon"/>
                      <text x="202" y="232" className="joyHome"> Z</text>
                    </g>

                    {/* XY Movement Rings - Outermost */}
                    <g fill="#c0c0c0" transform="translate(10, 10)">
                      <g transform="translate(120 120)" onClick={() => handleJoystickClick("Y+", stepSizeXY)}>
                        <path className="joyStd" d="M-60 -67.07 L-75.93,-83 A112.5,112.5 0 0,1 75,-83 L60,-67.07 A90,90 0 0,0 -60.00,-67.07 z" />
                      </g>
                      <g transform="translate(120 120)" onClick={() => handleJoystickClick("X+", stepSizeXY)}>
                        <path className="joyStd" d="M67.07,-60 L83,-75.93 A112.5,112.5 0 0,1 83,75.93 L67.07,60 A90,90 0 0,0 67.07,-60" />
                      </g>
                      <g transform="translate(120 120)" onClick={() => handleJoystickClick("Y-", stepSizeXY)}>
                        <path className="joyStd" d="M-60,67.07 L-75.93,83 A112.5,112.5 0 0,0 75,83 L60,67.07 A90,90 0 0,1 -60.00,67.07 z" />
                      </g>
                      <g transform="translate(120 120)" onClick={() => handleJoystickClick("X-", stepSizeXY)}>
                        <path className="joyStd" d="M-67.07,-60 L-83,-75.93 A112.5,112.5 0 0,0 -83,75.93 L-67.07,60 A90,90 0 0,1 -67.07,-60 z" />
                      </g>
                    </g>

                    {/* XY Movement Rings - Middle */}
                    <g fill="#d0d0d0" transform="translate(10, 10)">
                      <g transform="translate(120 120)" onClick={() => handleJoystickClick("Y+", stepSizeXY / 10)}>
                        <path className="joyStd" d="M-44.06 -51.13 L-60,-67.07 A90,90 0 0,1 60,-67 L44.06,-51.13 A67.5,67.5 0 0,0 -44.06,-51.13 z" />
                      </g>
                      <g transform="translate(120 120)" onClick={() => handleJoystickClick("X+", stepSizeXY / 10)}>
                        <path className="joyStd" d="M51.13 44.06 L67.07,60 A90,90 0 0,0 67.07,-60 L51.13,-44.06 A67.5,67.5 0 0,1 51.13,44.06 z" />
                      </g>
                      <g transform="translate(120 120)" onClick={() => handleJoystickClick("Y-", stepSizeXY / 10)}>
                        <path className="joyStd" d="M-44.06 51.13 L-60,67.07 A90,90 0 0,0 60,67 L44.06,51.13 A67.5,67.5 0 0,1 -44.06,51.13 z" />
                      </g>
                      <g transform="translate(120 120)" onClick={() => handleJoystickClick("X-", stepSizeXY / 10)}>
                        <path className="joyStd" d="M-51.13 44.06 L-67.07,60 A90,90 0 0,1 -67.07,-60 L-51.13,-44.06 A67.5,67.5 0 0,0 -51.13,44.06 z" />
                      </g>
                    </g>

                    {/* XY Movement Rings - Inner */}
                    <g fill="#e0e0e0" transform="translate(10, 10)">
                      <g transform="translate(120 120)" onClick={() => handleJoystickClick("Y+", stepSizeXY / 100)}>
                        <path className="joyStd" d="M-28.09 -35.16 L-44.06,-51.13 A67.5,67.5 0 0,1 44.06,-51.13 L28.09,-35.16 A45,45 0 0,0 -28.09,-35.16 z" />
                      </g>
                      <g transform="translate(120 120)" onClick={() => handleJoystickClick("X+", stepSizeXY / 100)}>
                        <path className="joyStd" d="M35.16 -28.09 L51.13,-44.06 A67.5,67.05 0 0,1 51.13,44.06 L35.16,28.09 A45,45 0 0,0 35.16,-28.09 z" />
                      </g>
                      <g transform="translate(120 120)" onClick={() => handleJoystickClick("Y-", stepSizeXY / 100)}>
                        <path className="joyStd" d="M-28.09 35.16 L-44.06,51.13 A67.5,67.5 0 0,0 44.06,51.13 L28.09,35.16 A45,45 0 0,1 -28.09,35.16 z" />
                      </g>
                      <g transform="translate(120 120)" onClick={() => handleJoystickClick("X-", stepSizeXY / 100)}>
                        <path className="joyStd" d="M-35.16 -28.09 L-51.13,-44.06 A67.5,67.05 0 0,0 -51.13,44.06 L-35.16,28.09 A45,45 0 0,1 -35.16,-28.09 z" />
                      </g>
                    </g>

                    {/* Z Movement Buttons - Multiple Step Sizes */}
                    {/* Z+ Full Step */}
                    <g fill="#c0c0c0" transform="translate(270, 10)" onClick={() => handleJoystickClick("Z+", stepSizeZ)}>
                      <rect className="joyStd" x="0" y="20" width="40" height="25" />
                      <circle cx="20" cy="32.5" r="10" fill="black" fillOpacity="0.5" stroke="red" strokeWidth="2"/>
                      <text x="8" y="37" className="joyScl" fontSize="12"> +{stepSizeZ}</text>
                    </g>
                    
                    {/* Z+ 1/10 Step */}
                    <g fill="#d0d0d0" transform="translate(270, 10)" onClick={() => handleJoystickClick("Z+", stepSizeZ / 10)}>
                      <rect className="joyStd" x="0" y="50" width="40" height="25" />
                      <circle cx="20" cy="62.5" r="10" fill="black" fillOpacity="0.5" stroke="orange" strokeWidth="2"/>
                      <text x="8" y="67" className="joyScl" fontSize="12"> +{stepSizeZ/10}</text>
                    </g>
                    
                    {/* Z+ 1/100 Step */}
                    <g fill="#e0e0e0" transform="translate(270, 10)" onClick={() => handleJoystickClick("Z+", stepSizeZ / 100)}>
                      <rect className="joyStd" x="0" y="80" width="40" height="25" />
                      <circle cx="20" cy="92.5" r="10" fill="black" fillOpacity="0.5" stroke="blue" strokeWidth="2"/>
                      <text x="8" y="97" className="joyScl" fontSize="12"> +{stepSizeZ/100}</text>
                    </g>
                    
                    {/* Z- 1/100 Step */}
                    <g fill="#e0e0e0" transform="translate(270, 10)" onClick={() => handleJoystickClick("Z-", stepSizeZ / 100)}>
                      <rect className="joyStd" x="0" y="155" width="40" height="25" />
                      <circle cx="20" cy="167.5" r="10" fill="black" fillOpacity="0.5" stroke="blue" strokeWidth="2"/>
                      <text x="8" y="172" className="joyScl" fontSize="12"> -{stepSizeZ/100}</text>
                    </g>
                    
                    {/* Z- 1/10 Step */}
                    <g fill="#d0d0d0" transform="translate(270, 10)" onClick={() => handleJoystickClick("Z-", stepSizeZ / 10)}>
                      <rect className="joyStd" x="0" y="185" width="40" height="25" />
                      <circle cx="20" cy="197.5" r="10" fill="black" fillOpacity="0.5" stroke="orange" strokeWidth="2"/>
                      <text x="8" y="202" className="joyScl" fontSize="12"> -{stepSizeZ/10}</text>
                    </g>
                    
                    {/* Z- Full Step */}
                    <g fill="#c0c0c0" transform="translate(270, 10)" onClick={() => handleJoystickClick("Z-", stepSizeZ)}>
                      <rect className="joyStd" x="0" y="215" width="40" height="25" />
                      <circle cx="20" cy="227.5" r="10" fill="black" fillOpacity="0.5" stroke="red" strokeWidth="2"/>
                      <text x="8" y="232" className="joyScl" fontSize="12"> -{stepSizeZ}</text>
                    </g>

                    {/* Direction indicators */}
                    <g pointerEvents="none" fontWeight="900" fontSize="11" fillOpacity=".6">
                      <path d="M120,20 l17,17 h-10 v11 h-14 v-11 h-10 z" fill="SteelBlue" transform="translate(10, 10)"/>
                      <path d="M120,220 l17,-17 h-10 v-11 h-14 v11 h-10 z" fill="SteelBlue" transform="translate(10, 10)"/>
                      <path d="M20,120 l17,17 v-10 h11 v-14 h-11 v-10 z" fill="Khaki" transform="translate(10, 10)"/>
                      <path d="M220,120 l-17,-17 v10 h-11 v14 h11 v10 z" fill="Khaki" transform="translate(10, 10)"/>
                      <text x="123" y="47" fill="black"> +Y</text>
                      <text x="123" y="232" fill="black"> -Y</text>
                      <text x="37" y="134" fill="black"> -X</text>
                      <text x="206" y="134" fill="black"> +X</text>
                    </g>
                  </svg>
                </Box>

                {/* Manual Home Buttons */}
                <Grid container spacing={1} style={{ marginTop: "20px" }}>
                  <Grid item xs={3}>
                    <Button variant="outlined" fullWidth onClick={() => homeAxis("X")}>
                      Home X
                    </Button>
                  </Grid>
                  <Grid item xs={3}>
                    <Button variant="outlined" fullWidth onClick={() => homeAxis("Y")}>
                      Home Y
                    </Button>
                  </Grid>
                  <Grid item xs={3}>
                    <Button variant="outlined" fullWidth onClick={() => homeAxis("Z")}>
                      Home Z
                    </Button>
                  </Grid>
                  <Grid item xs={3}>
                    <Button variant="contained" fullWidth onClick={() => homeAll()}>
                      Home All
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Box>

        <Box mb={3}>
          <Typography variant="h6">Autofocus</Typography>
          <AutofocusController hostIP={hostIP} hostPort={hostPort} />
        </Box>

        <Box mb={3}>
          <Typography variant="h6">Illumination</Typography>
          <IlluminationController hostIP={hostIP} hostPort={hostPort} />
        </Box>

        <Box mb={3}>
          <Typography variant="h6">Objective</Typography>
          <ObjectiveSwitcher hostIP={hostIP} hostPort={hostPort} />
        </Box>

        <Box mb={3}>
          <Typography variant="h6">Detector Trigger</Typography>
          <DetectorTriggerController hostIP={hostIP} hostPort={hostPort} />
        </Box>
      </Box>
    </Box>
  );
}

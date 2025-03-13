import React, { useRef, useContext, useState, useEffect } from "react";
import {
  PlayArrow,
  Stop,
  CameraAlt,
  FiberManualRecord,
  Stop as StopIcon,
} from "@mui/icons-material";
import {
  Box,
  Typography,
  Button,
  FormControlLabel,
  Switch,
  TextField,
  Slider,
  Checkbox,
  Tabs,
  Tab,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import { Bar } from "react-chartjs-2";
import XYZControls from "./XYZControls";
import AutofocusController from "./AutofocusController";
import DetectorParameters from "./DetectorParameters"; // <--- NEW COMPONENT
import { useWebSocket } from "../context/WebSocketContext";
import { LiveWidgetContext } from "../context/LiveWidgetContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const useStyles = makeStyles(() => ({
  blinking: {
    animation: `$blinkingEffect 1s infinite`,
  },
  "@keyframes blinkingEffect": {
    "0%": { opacity: 1 },
    "50%": { opacity: 0 },
    "100%": { opacity: 1 },
  },
}));

const appBarHeight = 64;

export default function LiveView({ hostIP, hostPort, drawerWidth }) {
  const classes = useStyles();
  const socket = useWebSocket();

  const [detectors, setDetectors] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  // For the first tab (socket-based image)
  const [imageUrls, setImageUrls] = useState({});

  // For the second tab (poll-based image)
  const [pollImageUrl, setPollImageUrl] = useState(null);

  // Additional info (pixel size from socket for scale bar)
  const [pixelSize, setPixelSize] = useState(null);

  const [isStreamRunning, setIsStreamRunning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Let the user toggle histogram overlay
  const [showHistogram, setShowHistogram] = useState(false);

  // Actual histogram data from the socket
  const [histogramX, setHistogramX] = useState([]);
  const [histogramY, setHistogramY] = useState([]);
  const [histogramActive, setHistogramActive] = useState(false);

  // The min/max slider for grayscale display
  const [minVal, setMinVal] = useState(0);
  const [maxVal, setMaxVal] = useState(1023);

  // Illumination
  const { sliderIllu2Value, sliderIllu3Value } = useContext(LiveWidgetContext);
  const [laserNames, setLaserNames] = useState([]);
  const [sliderIllu1Value, setSliderIllu1Value] = useState(0);
  const [isIllumination1Checked, setisIllumination1Checked] = useState(false);
  const [isIllumination2Checked, setisIllumination2Checked] = useState(false);
  const [isIllumination3Checked, setisIllumination3Checked] = useState(false);

  // Listen on socket for frames + histogram
  useEffect(() => {
    if (!socket) return;
    socket.on("signal", (data) => {
      const jdata = JSON.parse(data);
      if (jdata.name === "sigUpdateImage") {
        const detectorName = jdata.detectorname;
        const imgSrc = `data:image/jpeg;base64,${jdata.image}`;
        setImageUrls((prev) => ({ ...prev, [detectorName]: imgSrc }));
        if (jdata.pixelsize) {
          setPixelSize(jdata.pixelsize);
        }
      } else if (jdata.name === "sigHistogramComputed") {
        setHistogramX(jdata.args.p0);
        setHistogramY(jdata.args.p1);
      }
    });
    return () => socket.off("signal");
  }, [socket]);

  // Get detector names
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${hostIP}:${hostPort}/SettingsController/getDetectorNames`);
        const data = await response.json();
        setDetectors(data);
      } catch {}
    })();
  }, [hostIP, hostPort]);

  // Check if histogram is possible
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${hostIP}:${hostPort}/HistogrammController/histogrammActive`);
        if (response.status !== 404) setHistogramActive(true);
        else setHistogramActive(false);
      } catch {
        setHistogramActive(false);
      }
    })();
  }, [hostIP, hostPort]);

  // Fetch min/max values for initial slider setup
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${hostIP}:${hostPort}/HistogrammController/minmaxvalues`);
        if (!response.ok) return;
        const data = await response.json();
        setMinVal(data.minVal);
        setMaxVal(data.maxVal);
      } catch {}
    })();
  }, [hostIP, hostPort]);

  // Poll-based image: if there's a second detector, poll once per second
  useEffect(() => {
    if (activeTab === 1 && detectors.length > 1) {
      const intervalId = setInterval(async () => {
        try {
          const res = await fetch(
            `${hostIP}:${hostPort}/HistoScanController/getPreviewCameraImage?resizeFactor=1`
          );
          if (res.ok) {
            const blob = await res.blob();
            const urlObject = URL.createObjectURL(blob);
            setPollImageUrl(urlObject);
          }
        } catch {}
      }, 1000);
      return () => clearInterval(intervalId);
    }
  }, [activeTab, detectors, hostIP, hostPort]);

  // Get laser names
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${hostIP}:${hostPort}/LaserController/getLaserNames`);
        const data = await response.json();
        setLaserNames(data);
      } catch {}
    })();
  }, [hostIP, hostPort]);

  // If first laser name is available, get its value
  useEffect(() => {
    if (laserNames.length > 0) {
      (async () => {
        try {
          const response = await fetch(
            `${hostIP}:${hostPort}/LaserController/getLaserValue?laserName=${laserNames[0]}`
          );
          const data = await response.json();
          setSliderIllu1Value(data);
        } catch {}
      })();
    }
  }, [laserNames, hostIP, hostPort]);

  // Handlers for grayscale slider
  const handleRangeChange = (event, newValue) => {
    setMinVal(newValue[0]);
    setMaxVal(newValue[1]);
  };
  const handleRangeChangeCommitted = async (event, newValue) => {
    try {
      await fetch(
        `${hostIP}:${hostPort}/SettingsController/setDetectorPreviewMinMaxValue?minValue=${newValue[0]}&maxValue=${newValue[1]}`
      );
    } catch {}
  };

  // Streaming / snapping / recording
  const handleStreamToggle = async () => {
    const newStatus = !isStreamRunning;
    try {
      await fetch(`${hostIP}:${hostPort}/ViewController/setLiveViewActive?active=${newStatus}`);
    } catch {}
    setIsStreamRunning(newStatus);
  };

  const snapPhoto = async () => {
    try {
      await fetch(`${hostIP}:${hostPort}/RecordingController/snapImage?output=false&toList=true`);
    } catch {}
  };

  const startRecording = async () => {
    setIsRecording(true);
    try {
      await fetch(`${hostIP}:${hostPort}/RecordingController/startRecording?mSaveFormat=4`);
    } catch {}
  };

  const stopRecording = async () => {
    setIsRecording(false);
    try {
      await fetch(`${hostIP}:${hostPort}/RecordingController/stopRecording`);
    } catch {}
  };

  // Illumination
  const handleIlluminationSliderChange = async (event, laserIndex) => {
    const value = event.target.value;
    if (!laserNames[laserIndex]) return;
    const laserName = encodeURIComponent(laserNames[laserIndex]);
    try {
      await fetch(`${hostIP}:${hostPort}/LaserController/setLaserValue?laserName=${laserName}&value=${value}`);
    } catch {}
    if (laserIndex === 0) setSliderIllu1Value(value);
  };
  const handleIlluminationCheckboxChange = async (event, laserIndex) => {
    const isActive = event.target.checked ? "true" : "false";
    if (!laserNames[laserIndex]) return;
    const laserName = encodeURIComponent(laserNames[laserIndex]);
    try {
      await fetch(`${hostIP}:${hostPort}/LaserController/setLaserActive?laserName=${laserName}&active=${isActive}`);
    } catch {}
    if (laserIndex === 0) setisIllumination1Checked(event.target.checked);
    else if (laserIndex === 1) setisIllumination2Checked(event.target.checked);
    else if (laserIndex === 2) setisIllumination3Checked(event.target.checked);
  };

  // Tabs
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Stage movement
  const handleStageMove = async (direction) => {
    let url = "";
    if (direction === "up") {
      url = `${hostIP}:${hostPort}/PositionerController/movePositioner?axis=Y&dist=1000&isAbsolute=false&isBlocking=false`;
    } else if (direction === "down") {
      url = `${hostIP}:${hostPort}/PositionerController/movePositioner?axis=Y&dist=-1000&isAbsolute=false&isBlocking=false`;
    } else if (direction === "left") {
      url = `${hostIP}:${hostPort}/PositionerController/movePositioner?axis=X&dist=1000&isAbsolute=false&isBlocking=false`;
    } else if (direction === "right") {
      url = `${hostIP}:${hostPort}/PositionerController/movePositioner?axis=X&dist=-1000&isAbsolute=false&isBlocking=false`;
    }
    try {
      await fetch(url);
    } catch {}
  };

  // Scale bar calculation
  const scaleBarPx = 50;
  const scaleBarMicrons = pixelSize ? (scaleBarPx * pixelSize).toFixed(2) : null;

  const histogramData = {
    labels: histogramX,
    datasets: [
      {
        label: "Histogram",
        data: histogramY,
        borderWidth: 1,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Histogram" },
    },
    scales: {
      x: { max: 1024 },
      y: { beginAtZero: true },
    },
  };

  return (
    <>
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
        {/* LEFT COLUMN (Live stream, streaming controls, DetectorParameters) */}
        <Box
          sx={{
            width: "60%",
            height: "100%",
            p: 2,
            boxSizing: "border-box",
            position: "relative",
          }}
        >
          {/* Live controls row */}
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <Button
              onClick={handleStreamToggle}
              variant="contained"
              color={isStreamRunning ? "secondary" : "primary"}
            >
              {isStreamRunning ? <Stop /> : <PlayArrow />}
              {isStreamRunning ? "Stop Stream" : "Start Stream"}
            </Button>
            <Button onClick={snapPhoto}>
              <CameraAlt />
            </Button>
            <Button onClick={startRecording} className={isRecording ? classes.blinking : ""}>
              <FiberManualRecord />
            </Button>
            <Button onClick={stopRecording}>
              <StopIcon />
            </Button>
          </Box>

          {/* Detector parameter UI (new component) */}
          <DetectorParameters hostIP={hostIP} hostPort={hostPort} />

          {/* Checkbox to toggle histogram overlay */}
          {histogramActive && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={showHistogram}
                  onChange={(e) => setShowHistogram(e.target.checked)}
                />
              }
              label="Show Histogram Overlay"
            />
          )}

          {/* Detector Tabs */}
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mt: 2 }}>
            {detectors.map((detectorName) => (
              <Tab key={detectorName} label={detectorName} />
            ))}
          </Tabs>

          {/* Live Image region */}
          <Box sx={{ position: "relative", width: "100%", height: "calc(100% - 140px)", mt: 1 }}>
            {detectors[0] && (
              <Box
                sx={{
                  display: activeTab === 0 ? "block" : "none",
                  width: "100%",
                  height: "100%",
                  position: "relative",
                }}
              >
                {/* Histogram overlay */}
                {showHistogram && (
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
                    {histogramX.length && histogramY.length ? (
                      <Bar data={histogramData} options={chartOptions} />
                    ) : (
                      <Typography sx={{ color: "#fff" }}>Loading...</Typography>
                    )}
                  </Box>
                )}

                {/* Scale bar overlay */}
                {scaleBarMicrons && (
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 100,
                      left: "60%",
                      transform: "translateX(-50%)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      zIndex: 4,
                    }}
                  >
                    <Box sx={{ width: `${scaleBarPx}px`, height: "10px", backgroundColor: "white", marginRight: "16px" }} />
                    <Typography variant="body2">{scaleBarMicrons} µm</Typography>
                  </Box>
                )}

                {/* Stage movement overlay */}
                <Box sx={{ position: "absolute", bottom: 100, left: 10, zIndex: 3 }}>
                  <Button variant="contained" onClick={() => handleStageMove("up")} sx={{ mb: 1 }}>
                    ↑
                  </Button>
                  <Box sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
                    <Button variant="contained" onClick={() => handleStageMove("left")}>
                      ←
                    </Button>
                    <Button variant="contained" onClick={() => handleStageMove("right")}>
                      →
                    </Button>
                  </Box>
                  <Button variant="contained" onClick={() => handleStageMove("down")} sx={{ mt: 1 }}>
                    ↓
                  </Button>
                </Box>

                {/* The actual socket image */}
                {imageUrls[detectors[0]] ? (
                  <img
                    src={imageUrls[detectors[0]]}
                    alt={detectors[0]}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <Typography>No image from socket</Typography>
                )}

                {/* Vertical slider (min/max) overlay */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 10,
                    right: 0,
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    zIndex: 6,
                  }}
                >
                  <Slider
                    orientation="vertical"
                    value={[minVal, maxVal]}
                    onChange={handleRangeChange}
                    onChangeCommitted={handleRangeChangeCommitted}
                    min={0}
                    max={1024}
                    valueLabelDisplay="on"
                    valueLabelFormat={(val, idx) => (idx === 0 ? `Min: ${val}` : `Max: ${val}`)}
                    sx={{ height: "60%", mr: 1 }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#fff",
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                    }}
                  >
                    Gray Range
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Second tab => polled image */}
            {detectors.length > 1 && (
              <Box
                sx={{
                  display: activeTab === 1 ? "block" : "none",
                  width: "100%",
                  height: "100%",
                  position: "relative",
                }}
              >
                {pollImageUrl ? (
                  <img
                    src={pollImageUrl}
                    alt="Second Detector Poll"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <Typography>No polled image</Typography>
                )}
              </Box>
            )}
          </Box>
        </Box>

        {/* RIGHT COLUMN (Stage Control, Autofocus, Illumination) */}
        <Box
          sx={{
            width: "40%",
            height: "100%",
            overflowY: "auto",
            p: 2,
            boxSizing: "border-box",
          }}
        >
          <Box mb={3}>
            <Typography variant="h6">Stage Control</Typography>
            <XYZControls hostIP={hostIP} hostPort={hostPort} />
          </Box>

          <Box mb={3}>
            <Typography variant="h6">Autofocus</Typography>
            <AutofocusController hostIP={hostIP} hostPort={hostPort} />
          </Box>

          <Box mb={3}>
            <Typography variant="h6">Illumination</Typography>
            {laserNames.length > 0 ? (
              laserNames.map((laserName, index) => {
                const sliderVal =
                  index === 0
                    ? sliderIllu1Value
                    : index === 1
                    ? sliderIllu2Value
                    : sliderIllu3Value;
                const checkedVal =
                  index === 0
                    ? isIllumination1Checked
                    : index === 1
                    ? isIllumination2Checked
                    : isIllumination3Checked;

                return (
                  <Box
                    key={laserName}
                    sx={{ display: "flex", alignItems: "center", mb: 1 }}
                  >
                    <Typography sx={{ width: 80 }}>{laserName}</Typography>
                    <Slider
                      value={sliderVal}
                      min={0}
                      max={1023}
                      onChange={(e) => handleIlluminationSliderChange(e, index)}
                      sx={{ flex: 1, mx: 2 }}
                    />
                    <Checkbox
                      checked={checkedVal}
                      onChange={(e) => handleIlluminationCheckboxChange(e, index)}
                    />
                  </Box>
                );
              })
            ) : (
              <Typography>Loading laser names...</Typography>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
}

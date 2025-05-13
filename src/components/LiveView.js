import React, { useState, useEffect } from "react";
import { Box, Checkbox, FormControlLabel, Tabs, Tab, Typography, TextField, Button } from "@mui/material";
import { Bar } from "react-chartjs-2";
import XYZControls from "./XYZControls";
import AutofocusController from "./AutofocusController";
import DetectorParameters from "./DetectorParameters";
import StreamControls from "./StreamControls";
import IlluminationController from "./IlluminationController";
import ImageViewport from "./ImageViewport";
import { useWebSocket } from "../context/WebSocketContext";
import ObjectiveSwitcher from "./ObjectiveSwitcher";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const appBarHeight = 64;

export default function LiveView({ hostIP, hostPort, drawerWidth }) {
  const socket = useWebSocket();

  const [detectors, setDetectors] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [imageUrls, setImageUrls] = useState({});
  const [pollImageUrl, setPollImageUrl] = useState(null);
  const [pixelSize, setPixelSize] = useState(null);
  const [isStreamRunning, setIsStreamRunning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showHistogram, setShowHistogram] = useState(false);
  const [histogramX, setHistogramX] = useState([]);
  const [histogramY, setHistogramY] = useState([]);
  const [histogramActive, setHistogramActive] = useState(false);
  const [minVal, setMinVal] = useState(0);
  const [maxVal, setMaxVal] = useState(1023);
  const [snapFileName, setSnapFileName] = useState("test");

  /* socket */
  useEffect(() => {
    if (!socket) return;
    const handler = (d) => {
      const j = JSON.parse(d);
      if (j.name === "sigUpdateImage") {
        const det = j.detectorname;
        setImageUrls((p) => ({ ...p, [det]: `data:image/jpeg;base64,${j.image}` }));
        if (j.pixelsize) setPixelSize(j.pixelsize);
      } else if (j.name === "sigHistogramComputed") {
        setHistogramX(j.args.p0);
        setHistogramY(j.args.p1);
      }
    };
    socket.on("signal", handler);
    return () => socket.off("signal", handler);
  }, [socket]);

  /* detectors */
  useEffect(() => {
    (async () => {
      try {
        // 'getDetectorNames' must return something array-like
        const r = await fetch(`${hostIP}:${hostPort}/SettingsController/getDetectorNames`);
        const data = await r.json();
        // Check if data is an array before setting state
        if (Array.isArray(data)) {
          setDetectors(data);
        } else {
          console.error("getDetectorNames returned non-array:", data);
          setDetectors([]);
        }
      } catch (error) {
        console.error("Failed to fetch detectors:", error);
        setDetectors([]);
      }
    })();
  }, [hostIP, hostPort]);

  /* histogram availability */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${hostIP}:${hostPort}/HistogrammController/histogrammActive`);
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
        const r = await fetch(`${hostIP}:${hostPort}/HistogrammController/minmaxvalues`);
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
          if (res.ok) setPollImageUrl(URL.createObjectURL(await res.blob()));
        } catch {}
      }, 1000);
      return () => clearInterval(id);
    }
  }, [activeTab, detectors, hostIP, hostPort]);

  /* handlers */
  const handleRangeChange = (e, v) => {
    setMinVal(v[0]);
    setMaxVal(v[1]);
  };
  const handleRangeCommit = async (e, v) => {
    try {
      await fetch(
        `${hostIP}:${hostPort}/SettingsController/setDetectorPreviewMinMaxValue?minValue=${v[0]}&maxValue=${v[1]}`
      );
    } catch {}
  };
  const toggleStream = async () => {
    const n = !isStreamRunning;
    try {
      await fetch(`${hostIP}:${hostPort}/ViewController/setLiveViewActive?active=${n}`);
    } catch {}
    setIsStreamRunning(n);
  };
  const snap = async () =>
    fetch(`${hostIP}:${hostPort}/RecordingController/snapImageToPath?fileName=${encodeURIComponent(snapFileName)}`).catch(
      () => {}
    );
  const startRec = async () => {
    setIsRecording(true);
    fetch(`${hostIP}:${hostPort}/RecordingController/startRecording?mSaveFormat=4`).catch(() => {});
  };
  const stopRec = async () => {
    setIsRecording(false);
    fetch(`${hostIP}:${hostPort}/RecordingController/stopRecording`).catch(() => {});
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

  /* histogram dataset */
  const histogramData = {
    labels: histogramX,
    datasets: [{ label: "Histogram", data: histogramY, borderWidth: 1 }],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, title: { display: true, text: "Histogram" } },
    scales: { x: { max: 1024 }, y: { beginAtZero: true } },
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
            snapFileName={snapFileName}
            setSnapFileName={setSnapFileName}
          />
        </Box>

        <DetectorParameters hostIP={hostIP} hostPort={hostPort} />

        {histogramActive && (
          <FormControlLabel
            control={
              <Checkbox checked={showHistogram} onChange={(e) => setShowHistogram(e.target.checked)} />
            }
            label="Show Histogram Overlay"
          />
        )}

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mt: 2 }}>
          {detectors.map((d) => (
            <Tab key={d} label={d} />
          ))}
        </Tabs>

        <Box sx={{ width: "100%", height: "calc(100% - 140px)", mt: 1 }}>
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
          />
        </Box>
      </Box>

      {/* RIGHT */}
      <Box sx={{ width: "40%", height: "100%", overflowY: "auto", p: 2 }}>
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
          <IlluminationController hostIP={hostIP} hostPort={hostPort} />
        </Box>
        
        <Box mb={3}>
          <Typography variant="h6">Objective</Typography>
          <ObjectiveSwitcher hostIP={hostIP} hostPort={hostPort} />
        </Box>
      </Box>
    </Box>
  );
}

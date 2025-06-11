import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Checkbox,
  FormControlLabel,
  Tabs,
  Tab,
  Typography
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

        <Box mb={3}>
          <Typography variant="h6">Detector Trigger</Typography>
          <DetectorTriggerController hostIP={hostIP} hostPort={hostPort} />
        </Box>
      </Box>
    </Box>
  );
}

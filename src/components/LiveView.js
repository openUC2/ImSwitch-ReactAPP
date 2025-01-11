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
  Container,
  Typography,
  Button,
  FormControlLabel,
  Switch,
  TextField,
  Slider,
  Checkbox,
  Grid,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import { Bar } from "react-chartjs-2";
import XYZControls from "./XYZControls";
import { useWebSocket } from "../context/WebSocketContext";
import { LiveWidgetContext } from "../context/LiveWidgetContext";

// ... other imports for chart configuration, etc.

const useStyles = makeStyles((theme) => ({
  blinking: {
    animation: `$blinkingEffect 1s infinite`,
  },
  "@keyframes blinkingEffect": {
    "0%": { opacity: 1 },
    "50%": { opacity: 0 },
    "100%": { opacity: 1 },
  },
}));

const LiveView = ({ hostIP, hostPort, onImageUpdate }) => {
  const classes = useStyles();
  const socket = useWebSocket();

  // LiveWidgetContext
  const { sliderIllu2Value, sliderIllu3Value } = useContext(LiveWidgetContext);

  // Local States
  const [isStreamRunning, setIsStreamRunning] = useState(false);
  const [streamUrl, setStreamUrl] = useState("");
  const [minVal, setMinVal] = useState(0);
  const [maxVal, setMaxVal] = useState(1023);
  const [isRecording, setIsRecording] = useState(false);
  const [exposureTime, setExposureTime] = useState("");
  const [gain, setGain] = useState("");
  const [isCamSettingsAuto, setCamSettingsIsAuto] = useState(true);

  const [laserNames, setLaserNames] = useState([]);
  const [sliderIllu1Value, setSliderIllu1Value] = useState(0);
  const [isIllumination1Checked, setisIllumination1Checked] = useState(false);
  const [isIllumination2Checked, setisIllumination2Checked] = useState(false);
  const [isIllumination3Checked, setisIllumination3Checked] = useState(false);

  // For histogram
  const [histogrammX, setHistogrammX] = useState([]);
  const [histogrammY, setHistogrammY] = useState([]);
  const [histogramActive, setHistogramActive] = useState(false);
  const chartContainer = useRef(null);
  const chartRef = useRef(null);

  // ImJoy
  const [imjoyAPI, setImjoyAPI] = useState(null);

  /****************************************************
   * Example:  WebSocket and side-effects
   ****************************************************/
  useEffect(() => {
    if (!socket) return;

    // Listen for image updates
    socket.on("signal", (data) => {
      const jdata = JSON.parse(data);
      if (jdata.name === "sigUpdateImage" || jdata.name === "sigImageUpdated") {
        const imgSrc = `data:image/jpeg;base64,${jdata.image}`;
        setStreamUrl(imgSrc);
        // <-- CALL THE PROP so that App.js can store the image in sharedImage
        if (onImageUpdate) onImageUpdate(imgSrc);
      }
    });

    return () => {
      socket.off("signal");
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    // Listen for histogram
    socket.on("signal", (data) => {
      const jdata = JSON.parse(data);
      if (jdata.name === "sigHistogramComputed") {
        setHistogrammX(jdata.args.p0);
        setHistogrammY(jdata.args.p1);
      }
    });

    // Clean up the chart on unmount
    return () => {
      if (chartRef.current && chartRef.current.destroy) {
        chartRef.current.destroy();
      }
    };
  }, [socket]);

  // Check if histogram is active
  useEffect(() => {
    const checkHistogramStatus = async () => {
      try {
        const response = await fetch(
          `${hostIP}:${hostPort}/HistogrammController/histogrammActive`
        );
        if (response.status !== 404) setHistogramActive(true);
        else setHistogramActive(false);
      } catch (error) {
        setHistogramActive(false);
      }
    };
    checkHistogramStatus();
  }, [hostIP, hostPort]);

  // 3) Handler for slider changes (when the user stops dragging)
  const handleRangeChangeCommitted = async (event, newValue) => {
    try {
      // Send updated minVal/maxVal to the backend
      const url = `${hostIP}:${hostPort}/HistogrammController/setMinMaxValues?minVal=${newValue[0]}&maxVal=${newValue[1]}`;
      const response = await fetch(url, { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to update min/max values on the server");
      }
      console.log("Updated min/max values on backend");
    } catch (error) {
      console.error("Error updating min/max values:", error);
    }
  };

  // 2) Handler for slider changes (while the user is dragging)
  const handleRangeChange = (event, newValue) => {
    // newValue is an array [newMin, newMax]
    setMinVal(newValue[0]);
    setMaxVal(newValue[1]);
  };

  useEffect(() => {
    // 1) Fetch the min/max gray values on load
    const fetchMinMaxValues = async () => {
      try {
        const response = await fetch(
          `${hostIP}:${hostPort}/HistogrammController/minmaxvalues`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch min/max values");
        }
        const data = await response.json();
        // Expecting data structure: { "minVal": <number>, "maxVal": <number> }
        setMinVal(data.minVal);
        setMaxVal(data.maxVal);
      } catch (error) {
        console.error("Error fetching min/max values:", error);
      }
    };

    fetchMinMaxValues();
  }, [hostIP, hostPort]);

  // Get laser names
  useEffect(() => {
    const fetchLaserNames = async () => {
      try {
        const response = await fetch(
          `${hostIP}:${hostPort}/LaserController/getLaserNames`
        );
        const data = await response.json();
        setLaserNames(data);
      } catch (error) {
        console.error("Failed to fetch laser names:", error);
      }
    };

    fetchLaserNames();
  }, [hostIP, hostPort]);

  // If the first laser name is available, fetch its value
  useEffect(() => {
    const fetchLaserValues = async () => {
      try {
        const response = await fetch(
          `${hostIP}:${hostPort}/LaserController/getLaserValue?laserName=${laserNames[0]}`
        );
        const data = await response.json();
        setSliderIllu1Value(data);
      } catch (error) {
        console.error("Error fetching laser value:", error);
      }
    };
    if (laserNames.length > 0) fetchLaserValues();
  }, [laserNames, hostIP, hostPort]);

  /****************************************************
   * Example:  ImJoy Loader
   ****************************************************/
  const imageToImJoy = async () => {
    if (!imjoyAPI) {
      console.error("ImJoy API is not loaded yet");
      return;
    }
    try {
      const imageURL = `${hostIP}:${hostPort}/RecordingController/snapNumpyToFastAPI?resizeFactor=1`;
      const response = await fetch(imageURL);
      const bytes = await response.arrayBuffer();

      let ij = await imjoyAPI.getWindow("ImageJ.JS");
      if (!ij) {
        ij = await imjoyAPI.createWindow({
          src: "https://ij.imjoy.io",
          name: "ImageJ.JS",
          fullscreen: true,
        });
      } else {
        await ij.show();
      }
      await ij.viewImage(bytes, { name: "image.jpeg" });
    } catch (error) {
      console.error("Error sending to ImJoy:", error);
    }
  };

  /****************************************************
   * Handler Functions
   ****************************************************/
  const snapPhoto = async () => {
    const url = `${hostIP}:${hostPort}/RecordingController/snapImage?output=false&toList=true`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      console.log("Photo snapped");
    } catch (error) {
      console.error("Snap photo error:", error);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    const url = `${hostIP}:${hostPort}/RecordingController/startRecording?mSaveFormat=4`;
    fetch(url).catch((error) => console.error("Start recording error:", error));
  };

  const stopRecording = () => {
    setIsRecording(false);
    const url = `${hostIP}:${hostPort}/RecordingController/stopRecording`;
    fetch(url).catch((error) => console.error("Stop recording error:", error));
  };

  const handleCamSettingsSwitchChange = (event) => {
    setCamSettingsIsAuto(event.target.checked);
    const url = `${hostIP}:${hostPort}/SettingsController/setDetectorMode?isAuto=${event.target.checked}`;
    fetch(url).catch((error) => console.error("Cam mode error:", error));
  };

  const handleExposureChange = async (event) => {
    setExposureTime(event.target.value);
    const url = `${hostIP}:${hostPort}/SettingsController/setDetectorExposureTime?exposureTime=${event.target.value}`;
    fetch(url).catch((error) => console.error("Exposure error:", error));
  };

  const handleGainChange = async (event) => {
    setGain(event.target.value);
    const url = `${hostIP}:${hostPort}/SettingsController/setDetectorGain?gain=${event.target.value}`;
    fetch(url).catch((error) => console.error("Gain error:", error));
  };

  const handleIlluminationSliderChange = async (event, laserIndex) => {
    const value = event.target.value;
    if (!laserNames[laserIndex]) return;
    const laserName = encodeURIComponent(laserNames[laserIndex]);
    const url = `${hostIP}:${hostPort}/LaserController/setLaserValue?laserName=${laserName}&value=${value}`;
    fetch(url).catch((error) => console.error("Laser value error:", error));

    // Update local state if needed
    if (laserIndex === 0) setSliderIllu1Value(value);
  };

  const handleIlluminationCheckboxChange = async (event, laserIndex) => {
    const activeStatus = event.target.checked ? "true" : "false";
    if (!laserNames[laserIndex]) return;
    const laserName = encodeURIComponent(laserNames[laserIndex]);
    const url = `${hostIP}:${hostPort}/LaserController/setLaserActive?laserName=${laserName}&active=${activeStatus}`;
    fetch(url).catch((error) => console.error("Laser active error:", error));

    // Update local state
    if (laserIndex === 0) setisIllumination1Checked(event.target.checked);
    else if (laserIndex === 1) setisIllumination2Checked(event.target.checked);
    else if (laserIndex === 2) setisIllumination3Checked(event.target.checked);
  };

  // Toggle the live stream via the API
  const toggleStream = async (isActive) => {
    const url = `${hostIP}:${hostPort}/ViewController/setLiveViewActive?active=${isActive}`;
    await fetch(url).catch((error) =>
      console.error("Error toggling stream:", error)
    );
  };

  const handleStreamToggle = async () => {
    const newStatus = !isStreamRunning;
    await toggleStream(newStatus);
    setIsStreamRunning(newStatus);
  };

  /****************************************************
   * Histogram chart config
   ****************************************************/
  const histogramData = {
    labels: histogrammX,
    datasets: [
      {
        label: "Histogram",
        data: histogrammY,
        borderWidth: 1,
        backgroundColor: "rgba(63, 81, 181, 0.7)",
        borderColor: "rgba(63, 81, 181, 1)",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Histogram",
        font: { size: 18 },
        color: "#333",
      },
    },
    scales: {
      x: {
        max: 1024,
        title: {
          display: true,
          text: "Intensity",
          font: { size: 14 },
          color: "#333",
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Counts",
          font: { size: 14 },
          color: "#333",
        },
      },
    },
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "row" }}>
      {/****************************************************************
       *  LEFT COLUMN (LiveView + Camera Settings) - STICKY
       *  We make this column position: 'sticky', so it stays put.
       ****************************************************************/}
      <Box
        sx={{
          width: "60%",
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
          overflow: "hidden",
          borderRight: "1px solid #eee",
          p: 2,
          zIndex: 10, // keep it above the scrolled area if necessary
        }}
      >
        <Typography variant="h6" gutterBottom>
          Microscope Stream
        </Typography>
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
        <Button
          variant="contained"
          onClick={imageToImJoy}
          color="primary"
          startIcon={
            <img
              alt="ImJoy"
              src="https://biii.eu/sites/default/files/2019-08/imjoy-icon.png"
              style={{ width: 24, height: 24 }}
            />
          }
          sx={{ ml: 1 }}
        >
          To ImJoy
        </Button>
        <Button
          onClick={startRecording}
          className={isRecording ? classes.blinking : ""}
        >
          <FiberManualRecord />
        </Button>
        <Button onClick={stopRecording}>
          <StopIcon />
        </Button>

        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isCamSettingsAuto}
                onChange={handleCamSettingsSwitchChange}
                name="cameraSettings"
                color="primary"
              />
            }
            label={
              isCamSettingsAuto
                ? "Automatic Camera Settings"
                : "Manual Camera Settings"
            }
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <TextField
            label="Exposure Time"
            type="number"
            value={exposureTime}
            onChange={handleExposureChange}
            sx={{ mr: 2 }}
          />
          <TextField
            label="Gain"
            type="number"
            value={gain}
            onChange={handleGainChange}
          />
        </Box>

        {/*****************************************************************
         * Container with image (left) + slider (right)
         * We fix a height for the container so the slider can match it.
         *****************************************************************/}
        <Grid container sx={{ height: 500 }}>
          {/* Left side: the image */}
          <Grid item xs={11} sx={{ height: "100%" }}>
            {streamUrl ? (
              <img
                src={streamUrl}
                alt="Live Stream"
                style={{
                  width: "auto",
                  height: "100%", // fill vertical space
                  display: "block",
                }}
              />
            ) : (
              <Typography>No stream URL loaded</Typography>
            )}
          </Grid>

          {/* Right side: vertical slider */}
          <Grid
            item
            xs={1}
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Slider
              orientation="vertical"
              value={[minVal, maxVal]}
              onChange={handleRangeChange}
              onChangeCommitted={handleRangeChangeCommitted}
              min={0}
              max={65535} // or your actual image depth
              sx={{ height: "90%" }} // slightly smaller or "100%"
              // Show value labels always:
              valueLabelDisplay="on"
              // Format them as “Min: ###” and “Max: ###”
              valueLabelFormat={(val, index) =>
                index === 0 ? `Min: ${val}` : `Max: ${val}`
              }
              aria-labelledby="range-slider"
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          {histogramActive && (
            <Box
              sx={{
                width: "100%",
                maxWidth: 600,
                margin: "auto",
                p: 2,
                backgroundColor: "#fafafa",
                boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.1)",
                borderRadius: 2,
              }}
              ref={chartContainer}
            >
              <Typography variant="h6" align="center" sx={{ mb: 2 }}>
                Histogram
              </Typography>
              <Box sx={{ height: 300 }}>
                {histogrammX.length && histogrammY.length ? (
                  <Bar
                    id="histogramChart"
                    data={histogramData}
                    options={options}
                    ref={chartRef}
                  />
                ) : (
                  <Typography align="center">Loading data...</Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/****************************************************************
       *  RIGHT COLUMN (Stage + Illumination) - SCROLLABLE
       ****************************************************************/}
      <Box
        sx={{
          width: "40%",
          height: "100%",
          overflowY: "auto",
          p: 2,
          m: 2,
          boxSizing: "border-box", // So padding is included in total width
        }}
      >
        <Box mb={3} sx={{ width: "90%" }}>
          <Typography variant="h6" gutterBottom>
            Stage Control
          </Typography>
          <XYZControls hostIP={hostIP} hostPort={hostPort} />
        </Box>

        <Box mb={3} sx={{ width: "90%" }}>
          <Typography variant="h6" gutterBottom>
            Illumination
          </Typography>
          {laserNames && laserNames.length > 0 ? (
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
                    onChange={(event) =>
                      handleIlluminationSliderChange(event, index)
                    }
                    sx={{ flex: 1, mx: 2 }}
                  />
                  <Checkbox
                    checked={checkedVal}
                    onChange={(event) =>
                      handleIlluminationCheckboxChange(event, index)
                    }
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
  );
};

export default LiveView;

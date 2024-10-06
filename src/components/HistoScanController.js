import React, { useState, useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
  Tabs,
  Tab,
  Paper,
  Grid,
  TextField,
  Checkbox,
  Button,
  Typography,
  Slider,
  Select,
  MenuItem,
  LinearProgress,
} from "@mui/material";

const HistoScanController = ({ hostIP, hostPort }) => {
  const [illuminationSource, setIlluminationSource] = useState("Laser 1");
  const [illuminationValue, setIlluminationValue] = useState(128);
  const [stepSizeX, setStepSizeX] = useState("300");
  const [stepSizeY, setStepSizeY] = useState("300");
  const [stepsX, setStepsX] = useState("2");
  const [stepsY, setStepsY] = useState("2");
  const [path, setPath] = useState("Default Path");
  const [timeInterval, setTimeInterval] = useState("");
  const [numberOfScans, setNumberOfScans] = useState("");
  const [scanStatus, setScanStatus] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [scanIndex, setScanIndex] = useState(0);
  const [scanResultAvailable, setScanResultAvailable] = useState(false);
  const [currentPosition, setCurrentPosition] = useState([0, 0]);
  const [isStitchAshlar, setIsStitchAshlar] = useState(false);
  const [isStitchAshlarFlipX, setIsStitchAshlarFlipX] = useState(false);
  const [isStitchAshlarFlipY, setIsStitchAshlarFlipY] = useState(false);
  const [resizeFactor, setResizeFactor] = useState(1);
  const [initPosX, setInitPosX] = useState("");
  const [initPosY, setInitPosY] = useState("");
  const [selectedTab, setSelectedTab] = useState(0);
  const [imageUrl, setImageUrl] = useState("");

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleFetchImage = () => {
    fetch(`${hostIP}:${hostPort}/HistoScanController/getLastStitchedImage`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.blob();
      })
      .then((imageBlob) => {
        const imageUrl = URL.createObjectURL(imageBlob);
        setImageUrl(imageUrl);
      })
      .catch((error) => console.error("Error fetching image:", error));
  };

  const handleStart = () => {
    const nTimesValue = numberOfScans || 1;
    const tPeriodValue = timeInterval || 1;
    const mInitPosX = initPosX;
    const mInitPosY = initPosY;

    const url =
      `${hostIP}:${hostPort}/HistoScanController/startHistoScanTileBasedByParameters?` +
      `numberTilesX=${stepsX}&numberTilesY=${stepsY}&stepSizeX=${stepSizeX}&stepSizeY=${stepSizeY}&` +
      `nTimes=${nTimesValue}&tPeriod=${tPeriodValue}&` +
      `initPosX=${mInitPosX}&initPosY=${mInitPosY}&isStitchAshlar=${isStitchAshlar}&` +
      `isStitchAshlarFlipX=${isStitchAshlarFlipX}&isStitchAshlarFlipY=${isStitchAshlarFlipY}&resizeFactor=${resizeFactor}`;

    fetch(url, { method: "GET" })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
      })
      .catch((error) => console.error("Error:", error));
  };

  const handleStop = () => {
    const url = `${hostIP}:${hostPort}/HistoScanController/stopHistoScan`;
    fetch(url, { method: "GET" })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
      })
      .catch((error) => console.error("Error:", error));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const url = `${hostIP}:${hostPort}/HistoScanController/getHistoStatus`;
      fetch(url, { method: "GET" })
        .then((response) => response.json())
        .then((data) => {
          setScanStatus(data.ishistoscanRunning);
          setScanCount(data.mScanCount);
          setScanIndex(data.mScanIndex);
          setScanResultAvailable(data.stitchResultAvailable);
          setCurrentPosition(data.currentPosition);
        })
        .catch((error) => console.error("Error:", error));
    }, 1000);

    return () => clearInterval(interval);
  }, [hostIP, hostPort]);

  return (
    <Paper style={{ padding: "20px" }}>
      <Tabs value={selectedTab} onChange={handleTabChange}>
        <Tab label="Control" />
        <Tab label="Result" />
      </Tabs>

      {selectedTab === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6">HistoScan Controller</Typography>
          </Grid>

          {/* Illumination Source Selector */}
          <Grid item xs={6}>
            <Typography>Illumination Source:</Typography>
            <Select
              value={illuminationSource}
              onChange={(e) => setIlluminationSource(e.target.value)}
              fullWidth
            >
              <MenuItem value="Laser 1">Laser 1</MenuItem>
              <MenuItem value="Laser 2">Laser 2</MenuItem>
              <MenuItem value="LED">LED</MenuItem>
            </Select>
          </Grid>

          {/* Illumination Value Slider */}
          <Grid item xs={6}>
            <Typography>Illumination Value: {illuminationValue}</Typography>
            <Slider
              value={illuminationValue}
              onChange={(e, value) => setIlluminationValue(value)}
              max={255}
              step={1}
            />
          </Grid>

          {/* Position and other parameters */}
          <Grid item xs={6}>
            <TextField
              label="Step Size X"
              value={stepSizeX}
              onChange={(e) => setStepSizeX(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Step Size Y"
              value={stepSizeY}
              onChange={(e) => setStepSizeY(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="N-Steps X"
              value={stepsX}
              onChange={(e) => setStepsX(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="N-Steps Y"
              value={stepsY}
              onChange={(e) => setStepsY(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Time Interval (s)"
              value={timeInterval}
              onChange={(e) => setTimeInterval(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Number of Scans"
              value={numberOfScans}
              onChange={(e) => setNumberOfScans(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <Checkbox
              checked={isStitchAshlar}
              onChange={(e) => setIsStitchAshlar(e.target.checked)}
            />
            <Typography>Stitch Ashlar</Typography>
          </Grid>
          <Grid item xs={6}>
            <Checkbox
              checked={isStitchAshlarFlipX}
              onChange={(e) => setIsStitchAshlarFlipX(e.target.checked)}
            />
            <Typography>Stitch Ashlar Flip X</Typography>
          </Grid>
          <Grid item xs={6}>
            <Checkbox
              checked={isStitchAshlarFlipY}
              onChange={(e) => setIsStitchAshlarFlipY(e.target.checked)}
            />
            <Typography>Stitch Ashlar Flip Y</Typography>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Resize Factor"
              value={resizeFactor}
              onChange={(e) => setResizeFactor(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Initial Position X"
              value={initPosX}
              onChange={(e) => setInitPosX(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Initial Position Y"
              value={initPosY}
              onChange={(e) => setInitPosY(e.target.value)}
              fullWidth
            />
          </Grid>

          {/* Start and Stop buttons */}
          <Grid item xs={6}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleStart}
              disabled={scanStatus}
              fullWidth
            >
              Start
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleStop}
              disabled={!scanStatus}
              fullWidth
            >
              Stop
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body1" color={scanStatus ? "green" : "red"}>
              Scan Status: {scanStatus ? "Running" : "Stopped"}
            </Typography>

            {scanCount > 0 && (
              <>
                <Typography variant="body2">
                  Scanning: {scanIndex + 1} / {scanCount}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={((scanIndex + 1) / scanCount) * 100}
                />
              </>
            )}
          <Typography variant="body2">
              Result Available: {scanResultAvailable ? "Yes" : "No"}, Current
              Position: {currentPosition && currentPosition.length > 1 ? `${currentPosition[0]}, ${currentPosition[1]}` : 'Loading...'}
            </Typography>
          </Grid>
        </Grid>
      )}

      {selectedTab === 1 && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleFetchImage}
            >
              Fetch Last Stitched Image
            </Button>
          </Grid>
          {imageUrl && (
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = imageUrl;
                  link.download = "stitched_image.png"; // Set the default file name
                  link.click();
                }}
              >
                Download Image
              </Button>
              <div style={{ marginTop: "20px" }}>
                <TransformWrapper>
                  <TransformComponent>
                    <img
                      src={imageUrl}
                      alt="Last Stitched"
                      style={{ maxWidth: "100%", marginTop: "20px" }}
                    />
                  </TransformComponent>
                </TransformWrapper>
              </div>
            </Grid>
          )}
        </Grid>
      )}
    </Paper>
  );
};

export default HistoScanController;

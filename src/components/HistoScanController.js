import React, { useState, useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Rnd } from "react-rnd";
import { useWebSocket } from "../context/WebSocketContext";

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
  Menu,
  Box,
  MenuItem as MenuEntry,
  List,
  ListItem,
} from "@mui/material";

const HistoScanController = ({ hostIP, hostPort }) => {
  const [illuminationSource, setIlluminationSource] = useState("Laser 1");
  const [illuminationValue, setIlluminationValue] = useState(128);
  const [stepSizeX, setStepSizeX] = useState("300");
  const [stepSizeY, setStepSizeY] = useState("300");
  const [stepsX, setStepsX] = useState("2");
  const [stepsY, setStepsY] = useState("2");
  const [menuPosition, setMenuPosition] = useState({
    mouseX: null,
    mouseY: null,
  });
  const [path, setPath] = useState("Default Path");
  const [timeInterval, setTimeInterval] = useState("");
  const [numberOfScans, setNumberOfScans] = useState("");
  const [scanStatus, setScanStatus] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [scanIndex, setScanIndex] = useState(0);
  const [scanResultAvailable, setScanResultAvailable] = useState(false);
  const [isStitchAshlar, setIsStitchAshlar] = useState(false);
  const [isStitchAshlarFlipX, setIsStitchAshlarFlipX] = useState(false);
  const [isStitchAshlarFlipY, setIsStitchAshlarFlipY] = useState(false);
  const [resizeFactor, setResizeFactor] = useState(1);
  const [initPosX, setInitPosX] = useState("");
  const [initPosY, setInitPosY] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [anchorEl, setAnchorEl] = useState(null); // For right-click menu
  const [clickedPosition, setClickedPosition] = useState({ x: 0, y: 0 }); // Position clicked on the image
  const [savedPositions, setSavedPositions] = useState([]); // Store saved positions
  const [selectedTab, setSelectedTab] = useState(0);
  const [isPanningEnabled, setIsPanningEnabled] = useState(true); // Control panning state
  const [currentXY, setCurrentXY] = useState({ x: 0, y: 0 }); // Current XY position of the microscope
  const [lastPosition, setLastPosition] = useState(null); // Store last saved position for red dot overlay
  const [layoutFiles, setLayoutFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [layoutData, setLayoutData] = useState(null);
  const [scaledWells, setScaledWells] = useState([]);
  const [scanPoints, setScanPoints] = useState([]);
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);
  const socket = useWebSocket();
  const [positions, setPositions] = useState({ A: 0, X: 0, Y: 0, Z: 0 });
  const [positionerName, setPositionerName] = useState(""); // TODO: We should put most states in the contextmanager
  const [pixelToMMFactor, setPixelToMMFactor] = useState(1);
  const [MMToPixelScaledFactorX, setMMToPixelScaledFactorX] = useState(1);
  const [MMToPixelScaledFactorY, setMMToPixelScaledFactorY] = useState(1);
  const [streamUrl, setStreamUrl] = useState(
    `${hostIP}:${hostPort}/RecordingController/video_feeder`
  );
  const [videoSize, setVideoSize] = useState({ width: 320, height: 180 });
  const [videoPosition, setVideoPosition] = useState({ x: 50, y: 50 });

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  useEffect(() => {
    if (!socket) return;

    const handleSignal = (data) => {
      try {
        const jdata = JSON.parse(data);
        if (jdata.name === "sigUpdateScanCoordinatesLayout") {
          console.log("Signal received in HistoScanController", jdata);
          calculateScaledScanPoints(jdata);
        }
        else if (jdata.name === "sigUpdateLoadingBar") {
          console.log("Signal received in HistoScanController", jdata);
          setScanIndex(jdata.args.p0);
        } else if (jdata.name === "sigUpdateMotorPosition") {
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

    // Listen for signals
    socket.on("signal", handleSignal);
    return () => {
      socket.off("signal", handleSignal);
    };
  }, [socket]);

  const calculateScaledScanPoints = (jdata) => {
    try {
      // {"name": "sigUpdateScanCoordinatesLayout", "args": {"p0": "{'shape': (96, 2, 5), 'data': [[[15000.0, 11000.0,
      // we have to parse the 3d array and propagate these positions in the Wellplate
      // 1. get the shape of the array
      // 2. get the data of the array
      // 3. iterate over the data and set the positions in the wellplate
      // 4. update the wellplate
      // get img as wellplate
      const img = document.getElementById("map");
      if (!img || !layoutData) return;

      const renderedWidth = img.offsetWidth;
      const renderedHeight = img.offsetHeight;
      const parsedArgs = JSON.parse(jdata.args.p0.replace(/'/g, '"'));
      const shape = parsedArgs.shape;
      const data = parsedArgs.data;

      // Initialise all scan points
      const allScanPoints = [];
      for (let wellIndex = 0; wellIndex < data.length; wellIndex++) {
        const wellData = data[wellIndex];
        const [xCoords, yCoords] = wellData; // all x/y coordinates for the current well in
        for (let pointIndex = 0; pointIndex < xCoords.length; pointIndex++) {
          const rawX = parseFloat(xCoords[pointIndex]);
          const rawY = parseFloat(yCoords[pointIndex]);

          // rawX/Y are in mm so we have to bring them to the pixel world and scale them
          setMMToPixelScaledFactorX(
            parsedArgs.pixelToMMFactor *
              (renderedWidth / parsedArgs.pixelImageX)
          );
          setMMToPixelScaledFactorY(
            parsedArgs.pixelToMMFactor *
              (renderedHeight / parsedArgs.pixelImageY)
          );
          const scaledX =
            rawX *
            parsedArgs.pixelToMMFactor *
            (renderedWidth / parsedArgs.pixelImageX); // Convert to pixelated-mm
          const scaledY =
            rawY *
            parsedArgs.pixelToMMFactor *
            (renderedHeight / parsedArgs.pixelImageY); // Convert to pixelated-mm

          allScanPoints.push({
            wellID: wellIndex + 1,
            scaledX: scaledX,
            scaledY: scaledY,
          });
        }
      }

      // Update the state variable
      setScanPoints(allScanPoints);
      //console.log("Alle Scan-Punkte aktualisiert:", allScanPoints);
    } catch (error) {
      console.error("Error parsing signal data:", error);
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

      console.log(
        "Fetched Positions from positionerName ",
        positionerName,
        ":",
        data[positionerName]
      );
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

  // useEffect() hook to fetch the positioner name and positions when the component mounts
  useEffect(() => {
    console.log("Fetching positioner name and positions...");
    getPositionerName();
  }, [hostIP, hostPort]);

  const getPositionerName = async () => {
    try {
      const response = await fetch(
        `${hostIP}:${hostPort}/PositionerController/getPositionerNames`
      );
      const data = await response.json();
      setPositionerName(data[0]); // Assume first element if multiple names are returned
    } catch (error) {
      console.error("Error fetching positioner name:", error);
    }
  };

  useEffect(() => {
    const fetchHistoStatus = async () => {
      try {
        const response = await fetch(
          `${hostIP}:${hostPort}/HistoScanController/getHistoStatus`
        );
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();

        // Update the state variables based on the extended response
        setScanStatus(data.ishistoscanRunning);
        setScanResultAvailable(data.stitchResultAvailable);
        setScanIndex(data.mScanIndex);
        setScanCount(data.mScanCount);
        setStepSizeX(parseInt(data.currentStepSizeX));
        setStepSizeY(parseInt(data.currentStepSizeY));
        setStepsX(data.currentNX.toString());
        setStepsY(data.currentNY.toString());
        setIsStitchAshlar(data.currentAshlarStitching);
        setIsStitchAshlarFlipX(data.currentAshlarFlipX);
        setIsStitchAshlarFlipY(data.currentAshlarFlipY);
        setResizeFactor(data.currentResizeFactor.toString());
        setInitPosX(parseInt(data.currentIinitialPosX).toString());
        setInitPosY(parseInt(data.currentIinitialPosY).toString());
        setTimeInterval(data.currentTimeInterval.toString());
        setNumberOfScans(data.currentNtimes.toString());
        // If pixel size needs to be displayed or used
        console.log(`Pixel Size: ${data.pixelSize}`);
      } catch (error) {
        console.error("Error fetching HistoScan status:", error);
      }
    };

    fetchHistoStatus();
  }, []);

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
      `isStitchAshlarFlipX=${isStitchAshlarFlipX}&isStitchAshlarFlipY=${isStitchAshlarFlipY}&resizeFactor=${resizeFactor}&` +
      `overlap=0.75`;

    fetch(url, { method: "GET" })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
      })
      .catch((error) => console.error("Error:", error));
  };

  // Fetch available layout files on mount
  useEffect(() => {
    const fetchLayoutFiles = async () => {
      try {
        const response = await fetch(
          `${hostIP}:${hostPort}/HistoScanController/getSampleLayoutFilePaths`
        );
        const files = await response.json();
        setLayoutFiles(files);
        setSelectedFile(files[0]); // Default to the first file
      } catch (error) {
        console.error("Error fetching layout files:", error);
      }
    };
    fetchLayoutFiles();
  }, [hostIP, hostPort]);

  // Fetch and load selected layout file
  const handleLayoutChange = async (file) => {
    setSelectedFile(file);
    try {
      const response = await fetch(`${hostIP}:${hostPort}/${file}`);
      const layout = await response.json();
      // update the server state
      await fetch(
        `${hostIP}:${hostPort}/HistoScanController/setActiveSampleLayoutFilePath?filePath=${file}`
      );
      setLayoutData(layout);
      setMapUrl(`${hostIP}:${hostPort}/${layout.ScanParameters.imagePath}`); // Set the image URL dynamically
      setScaledWells([]); // Reset scaled wells
    } catch (error) {
      console.error("Error loading layout:", error);
    }
  };

  const calculateScaledPositions = (img) => {
    if (!img || !layoutData) return;

    const renderedWidth = img.offsetWidth;
    const renderedHeight = img.offsetHeight;

    const scaleX = renderedWidth / layoutData.ScanParameters.pixelImageX; // (pixels_on_screen) / (pixels_in_image) = scaling factor
    const scaleY = renderedHeight / layoutData.ScanParameters.pixelImageY;

    // scale the center positions on the image
    // well-position is give in pixel, we have to convert it to scaled pixel coordinates in the displayed image (e.g. shrink it)
    const scaledPositions = layoutData.ScanParameters.wells.map((well) => ({
      ...well,
      scaledX: well.positionXpx * scaleX,
      scaledY: well.positionYpx * scaleY,
    }));
    // update the states
    setScaleX(scaleX);
    setScaleY(scaleY);
    setScaledWells(scaledPositions);
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

  // Handle right-click and open context menu at the clicked position
  const handleImageRightClick = (event) => {
    event.preventDefault(); // Prevent the default browser context menu
    console.log("Right-clicked on the image");
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left; // x position within the image
    const y = event.clientY - rect.top; // y position within the image
    setClickedPosition({ x, y });

    // Store the mouse coordinates to position the menu
    setMenuPosition({ mouseX: event.clientX, mouseY: event.clientY });
    setAnchorEl(event.currentTarget);
    setIsPanningEnabled(false); // Disable panning when right-clicking
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuPosition({ mouseX: null, mouseY: null });
    setIsPanningEnabled(true); // Re-enable panning after closing the menu
  };

  // Function to send position to controller
  const goToPosition = (axis, dist) => {
    // first scale the distance as this is scaled pixel coorindates in the image
    // MMToPixelScaledFactorX
    // MMToPixelScaledFactorY
    if (axis === "X") {
      dist = (dist / MMToPixelScaledFactorX) * 1000;
    } else if (axis === "Y") {
      dist = (dist / MMToPixelScaledFactorY) * 1000;
    } else if (axis === "XY") {
      dist = {
        x: (dist[0] / MMToPixelScaledFactorX) * 1000,
        y: (dist[1] / MMToPixelScaledFactorY) * 1000,
      };
    }
    let url = `${hostIP}:${hostPort}/PositionerController/movePositioner?axis=${axis}&dist=${dist}&isAbsolute=true&isBlocking=false`;
    if (axis === "XY") {
      url = `${hostIP}:${hostPort}/PositionerController/movePositioner?axis=XY&dist=${dist.x},${dist.y}&isAbsolute=true&isBlocking=false`;
    }
    fetch(url, { method: "GET" })
      .then((response) => response.json())
      .then((data) => console.log("Positioner moved:", data))
      .catch((error) => console.error("Error:", error));
  };

  // Save position in the list
  const savePosition = () => {
    setSavedPositions([...savedPositions, clickedPosition]);
    setLastPosition(clickedPosition); // Store the last saved position for red dot
    handleCloseMenu();
  };

  // Send both X and Y coordinates
  const goToXYPosition = () => {
    setLastPosition(clickedPosition);
    // Add a delay of 500 ms to await the X movement
    setTimeout(() => {
      goToPosition("X", clickedPosition.x);
    }, 500);
    goToPosition("Y", clickedPosition.y);
    handleCloseMenu();
  };

  useEffect(() => {
    const handleResize = () => {
      const img = document.querySelector("img[alt='Map']");
      if (img) calculateScaledPositions(img);
    };

    const debouncedResize = debounce(handleResize, 100);

    window.addEventListener("resize", debouncedResize);
    return () => {
      window.removeEventListener("resize", debouncedResize);
    };
  }, [layoutData]);

  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  };

  return (
    <Paper style={{ padding: "20px" }}>
      <Tabs value={selectedTab} onChange={handleTabChange}>
        <Tab label="Control" />
        <Tab label="Result" />
        <Tab label="Map" />
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
              Position:{" "}
              {positions && positions.length > 1
                ? `${positions[0]}, ${positions[1]}`
                : "Loading..."}
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
                <TransformWrapper
                  panning={{ disabled: !isPanningEnabled }} // Control panning state
                >
                  <TransformComponent>
                    <img
                      src={imageUrl}
                      alt="Map"
                      style={{ width: "1000px"}} 
                      />
                  </TransformComponent>
                </TransformWrapper>
              </div>
            </Grid>
          )}
        </Grid>
      )}
      {selectedTab === 2 && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6">Select Layout</Typography>
            <Select
              value={selectedFile}
              onChange={(e) => handleLayoutChange(e.target.value)}
              fullWidth
            >
              {layoutFiles.map((file, index) => (
                <MenuItem key={index} value={file}>
                  {file.split("/").pop()}
                </MenuItem>
              ))}
            </Select>
          </Grid>
          <div>
            {layoutData && (
              <div style={{ position: "relative", padding: 0, margin: 0 }}>
                <img
                  src={mapUrl}
                  alt="Map"
                  id="map"
                  style={{
                    maxWidth: "100%",
                    display: "block",
                    margin: 0,
                    padding: 0,
                  }}
                  onLoad={(e) => calculateScaledPositions(e.target)}
                />
                <svg
                  onContextMenu={handleImageRightClick} // Handle right-click
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                  }}
                >
                  {/* Blue circles */}
                  {scaledWells.map((well) => (
                    <circle
                      key={well.wellID}
                      cx={well.scaledX}
                      cy={well.scaledY}
                      r={5}
                      fill="blue"
                      title={well.wellID}
                    />
                  ))}
                  {/* Referenz zu x, y aus dem aktuellen Zustand oder Props */}
                  {positions && (
                    <circle
                      cx={(positions.X * MMToPixelScaledFactorX) / 1000} // convert mm to scaled pixel coordinates
                      cy={(positions.Y * MMToPixelScaledFactorY) / 1000} // convert mm to scaled pixel coordinates
                      r={10}
                      fill="green"
                      title={`Pos: (${
                        (positions.X * MMToPixelScaledFactorX) / 1000
                      }, ${(positions.Y * MMToPixelScaledFactorY) / 1000})`}
                    />
                  )}
                  {/* red rectangular TODO: We should scale the width based on the FOV*/}
                  {scanPoints.map((point, index) => (
                    <rect
                      key={index}
                      x={point.scaledX - 2.5}
                      y={point.scaledY - 2.5}
                      width={5}
                      height={5}
                      fill="red"
                      title={`Scan Point ${index + 1}`}
                    />
                  ))}

                  {/* Context menu for right-click */}
                  <Menu
                    anchorReference="anchorPosition"
                    anchorPosition={
                      menuPosition.mouseY !== null &&
                      menuPosition.mouseX !== null
                        ? {
                            top: menuPosition.mouseY,
                            left: menuPosition.mouseX,
                          }
                        : undefined
                    }
                    open={Boolean(anchorEl)}
                    onClose={handleCloseMenu}
                  >
                    <MenuEntry
                      onClick={() => goToPosition("X", clickedPosition.x)}
                    >
                      Go to X Position
                    </MenuEntry>
                    <MenuEntry
                      onClick={() => goToPosition("Y", clickedPosition.y)}
                    >
                      Go to Y Position
                    </MenuEntry>
                    <MenuEntry onClick={goToXYPosition}>
                      Go to X & Y Position
                    </MenuEntry>
                    <MenuEntry onClick={savePosition}>Save Position</MenuEntry>
                  </Menu>
                  {/* Display current XY position */}
                  <Box mt={2}>
                    <Typography variant="h6">
                      Current XY Position: X = {currentXY.x.toFixed(2)}, Y ={" "}
                      {currentXY.y.toFixed(2)}
                    </Typography>
                  </Box>
                </svg>
              </div>
            )}
          </div>
        </Grid>
      )}
      {selectedTab === 3 && (
        <Grid container spacing={2}>
          {mapUrl && (
            <Grid item xs={12}>
              <div style={{ marginTop: "20px", position: "relative" }}>
                <img
                  src={mapUrl}
                  alt="Map"
                  style={{ maxWidth: "100%" }}
                  onContextMenu={handleImageRightClick} // Handle right-click
                />
                {lastPosition && (
                  <div
                    style={{
                      position: "absolute",
                      top: `${lastPosition.y}px`,
                      left: `${lastPosition.x}px`,
                      width: "10px",
                      height: "10px",
                      backgroundColor: "red",
                      borderRadius: "50%",
                      transform: "translate(-50%, -50%)", // Center the dot
                    }}
                  />
                )}
                {currentXY && (
                  <div
                    style={{
                      position: "absolute",
                      top: `${currentXY.y}px`,
                      left: `${currentXY.x}px`,
                      width: "10px",
                      height: "10px",
                      backgroundColor: "blue",
                      borderRadius: "50%",
                      transform: "translate(-50%, -50%)", // Center the dot
                    }}
                  />
                )}
                <TransformWrapper
                  onPanningStart={(e) => e.preventDefault()} // Disable panning on right-click
                  onPinchingStart={(e) => e.preventDefault()} // Disable pinching on right-click
                  panning={{ disabled: !isPanningEnabled }} // Control panning state
                >
                  <TransformComponent></TransformComponent>
                </TransformWrapper>

                {/* Context menu for right-click */}
                <Menu
                  anchorReference="anchorPosition"
                  anchorPosition={
                    menuPosition.mouseY !== null && menuPosition.mouseX !== null
                      ? { top: menuPosition.mouseY, left: menuPosition.mouseX }
                      : undefined
                  }
                  open={Boolean(anchorEl)}
                  onClose={handleCloseMenu}
                >
                  <MenuEntry
                    onClick={() => goToPosition("X", clickedPosition.x)}
                  >
                    Go to X Position
                  </MenuEntry>
                  <MenuEntry
                    onClick={() => goToPosition("Y", clickedPosition.y)}
                  >
                    Go to Y Position
                  </MenuEntry>
                  <MenuEntry onClick={goToXYPosition}>
                    Go to X & Y Position
                  </MenuEntry>
                  <MenuEntry onClick={savePosition}>Save Position</MenuEntry>
                </Menu>
                {/* Display current XY position */}
                <Box mt={2}>
                  <Typography variant="h6">
                    Current XY Position: X = {currentXY.x.toFixed(2)}, Y ={" "}
                    {currentXY.y.toFixed(2)}
                  </Typography>
                </Box>
              </div>
            </Grid>
          )}

          {/* Display saved positions */}
          <Grid item xs={12}>
            <Typography variant="h6">Saved Positions</Typography>
            <List>
              {savedPositions.map((pos, index) => (
                <ListItem key={index}>
                  Position {index + 1}: X = {pos.x}, Y = {pos.y}
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>
      )}
      {/*
      <Rnd
        bounds="parent" // Restricts dragging within the parent container
        size={{ width: videoSize.width, height: videoSize.height }}
        position={{ x: videoPosition.x, y: videoPosition.y }}
        onDragStop={(e, d) => {
          setVideoPosition({ x: d.x, y: d.y });
        }}
        disableResizing={true} // Disable resizing
        dragHandleClassName="drag-handle" // Specify drag handle
        style={{
          zIndex: 10, // Ensure the video stays on top
          border: "1px solid #ccc",
          background: "#000", // Placeholder background color
          position: "relative",
        }}
      >
        
        <iframe
          src={streamUrl}
          style={{
            width: "100%",
            height: "100%",
            border: "none", // Remove default iframe borders
          }}
          allow="autoplay"
        />
        <div
          className="drag-handle"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.2)", // Semi-transparent overlay for drag handle
            cursor: "move", // Change cursor to indicate draggable area
          }}
        />
      </Rnd>
        */}
    </Paper>
  );
};

export default HistoScanController;

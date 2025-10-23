import { useEffect, useRef, useCallback } from "react"; // Add useCallback import
import { useDispatch, useSelector } from "react-redux";
import store from "../state/store.js";
import * as connectionSettingsSlice from "../state/slices/ConnectionSettingsSlice.js";
import * as webSocketSlice from "../state/slices/WebSocketSlice.js";
import * as experimentStateSlice from "../state/slices/ExperimentStateSlice.js";
import * as liveStreamSlice from "../state/slices/LiveStreamSlice.js";
import * as tileStreamSlice from "../state/slices/TileStreamSlice.js";
import * as positionSlice from "../state/slices/PositionSlice.js";
import * as objectiveSlice from "../state/slices/ObjectiveSlice.js";
import * as omeZarrSlice from "../state/slices/OmeZarrTileStreamSlice.js";
import * as focusLockSlice from "../state/slices/FocusLockSlice.js";
import * as mazeGameSlice from "../state/slices/MazeGameSlice.js";
import * as uc2Slice from "../state/slices/UC2Slice.js";

import { io } from "socket.io-client";

//##################################################################################
const WebSocketHandler = () => {
  const dispatch = useDispatch();
  const connectionCheckRef = useRef(null);

  // Access global Redux state
  const connectionSettingsState = useSelector(
    connectionSettingsSlice.getConnectionSettingsState
  );
  const hostIP = connectionSettingsState.ip;
  const hostPort = connectionSettingsState.apiPort;

  // Memoized connection check function - following React best practices
  const checkUc2Connection = useCallback(
    async (ip = hostIP, port = hostPort) => {
      // Skip monitoring if backend connection is not configured
      if (!ip || !port) {
        dispatch(uc2Slice.setUc2Connected(false));
        return;
      }

      try {
        console.log(`Checking UC2 connection to ${ip}:${port}`);

        const response = await fetch(
          `${ip}:${port}/UC2ConfigController/is_connected`,
          {
            method: "GET",
            signal: AbortSignal.timeout(8000),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const isConnected = data === true;
          console.log(
            `UC2 connection check result: ${
              isConnected ? "Connected" : "Not connected"
            }`
          );
          dispatch(uc2Slice.setUc2Connected(isConnected));
          return isConnected;
        } else {
          console.log(`UC2 connection check: HTTP ${response.status}`);
          dispatch(uc2Slice.setUc2Connected(false));
          return false;
        }
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("UC2 connection check: Request timeout");
        } else {
          console.log("UC2 connection check: Network error", error.message);
        }
        dispatch(uc2Slice.setUc2Connected(false));
        return false;
      }
    },
    [hostIP, hostPort, dispatch] // Dependencies for useCallback
  );

  // WebSocket connection test
  const testWebSocketConnection = useCallback(
    async (ip, port) => {
      const testIP = ip || hostIP;
      const testPort = port || connectionSettingsState.websocketPort;

      if (!testIP || !testPort) {
        dispatch(webSocketSlice.setTestStatus("failed"));
        return false;
      }

      // Extract protocol from IP settings (following Copilot Instructions)
      let protocol = "http"; // Default fallback
      let cleanIP = testIP;

      if (testIP.startsWith("https://")) {
        protocol = "https";
        cleanIP = testIP.replace(/^https?:\/\//, "");
      } else if (testIP.startsWith("http://")) {
        protocol = "http";
        cleanIP = testIP.replace(/^https?:\/\//, "");
      } else {
        // No protocol specified, use HTTP as default
        cleanIP = testIP;
      }

      const socketIOUrl = `${protocol}://${cleanIP}:${testPort}`;

      console.log(
        `Testing Socket.IO connection to: ${socketIOUrl} (protocol: ${protocol})`
      );
      dispatch(webSocketSlice.setTestStatus("testing"));

      return new Promise((resolve) => {
        try {
          const testSocket = io(socketIOUrl, {
            transports: ["websocket"], // Force WebSocket transport
            timeout: 5000,
            forceNew: true, // Create new connection for test
            autoConnect: false, // Manual connection control
            secure: protocol === "https", // Enable secure connection for HTTPS
          });

          const timeout = setTimeout(() => {
            testSocket.disconnect();
            dispatch(webSocketSlice.setTestStatus("timeout"));
            console.log("Socket.IO test: Timeout after 5 seconds");
            resolve(false);
          }, 5000);

          testSocket.on("connect", () => {
            clearTimeout(timeout);
            dispatch(webSocketSlice.setTestStatus("success"));
            console.log(
              `Socket.IO test: Connection successful via ${protocol}`
            );
            testSocket.disconnect(); // Disconnect test connection immediately
            resolve(true);
          });

          testSocket.on("connect_error", (error) => {
            clearTimeout(timeout);
            dispatch(webSocketSlice.setTestStatus("failed"));
            console.log(
              `Socket.IO test: Connection failed via ${protocol}`,
              error.message
            );
            testSocket.disconnect();
            resolve(false);
          });

          // Start the connection test
          testSocket.connect();
        } catch (error) {
          dispatch(webSocketSlice.setTestStatus("failed"));
          console.error("Socket.IO test: Exception during connection", error);
          resolve(false);
        }
      });
    },
    [hostIP, connectionSettingsState.websocketPort, dispatch]
  );

  // Listen for manual connection check requests
  useEffect(() => {
    const handleManualConnectionCheck = async (event) => {
      console.log("Manual connection check triggered (HTTP + WebSocket)");
      const { ip, port, websocketPort } = event.detail || {};

      // Test HTTP connection first
      const httpResult = await checkUc2Connection(ip, port);

      // Test WebSocket connection if websocketPort is provided
      if (websocketPort) {
        const wsResult = await testWebSocketConnection(ip, websocketPort);
        console.log(
          `Connection test results - HTTP: ${httpResult}, WebSocket: ${wsResult}`
        );
      }
    };

    // Add event listener for manual connection checks
    window.addEventListener(
      "imswitch:checkConnection",
      handleManualConnectionCheck
    );

    return () => {
      window.removeEventListener(
        "imswitch:checkConnection",
        handleManualConnectionCheck
      );
    };
  }, [checkUc2Connection, testWebSocketConnection]);

  // Listen for WebSocket test requests
  useEffect(() => {
    const handleWebSocketTest = async (event) => {
      console.log("WebSocket connection test triggered");
      const { ip, websocketPort } = event.detail || {};

      const result = await testWebSocketConnection(ip, websocketPort);
      console.log(`WebSocket test result: ${result}`);
    };

    window.addEventListener("imswitch:testWebSocket", handleWebSocketTest);

    return () => {
      window.removeEventListener("imswitch:testWebSocket", handleWebSocketTest);
    };
  }, [testWebSocketConnection]);

  //##################################################################################
  useEffect(() => {
    // Extract protocol from connection settings
    let protocol = "http"; // Default fallback
    let cleanIP = connectionSettingsState.ip;

    if (connectionSettingsState.ip.startsWith("https://")) {
      protocol = "https";
      cleanIP = connectionSettingsState.ip.replace(/^https?:\/\//, "");
    } else if (connectionSettingsState.ip.startsWith("http://")) {
      protocol = "http";
      cleanIP = connectionSettingsState.ip.replace(/^https?:\/\//, "");
    }

    // Create the socket with proper protocol
    const address = `${protocol}://${cleanIP}:${connectionSettingsState.websocketPort}`;
    console.log(`WebSocket connecting to: ${address} (protocol: ${protocol})`);

    const socket = io(address, {
      transports: ["websocket"],
      secure: protocol === "https", // Enable secure connection for HTTPS
    });

    //listen to all
    socket.on("*", (packet) => {
      const [eventName, data] = packet.data;
      console.log(`WebSocket received event: ${eventName}`, data);
    });

    // Listen for a connection confirmation
    socket.on("connect", () => {
      console.log(`WebSocket connected with socket id: ${socket.id}`);
      //update redux state
      dispatch(webSocketSlice.setConnected(true));
    });

    // Store frame metadata for UC2F parsing
    let frameMetadata = null;

    // Listen for binary frame events (UC2F packets)
    socket.on("frame", (buf, ack) => {
      /*
      console.log('WebSocketHandler: Received UC2F frame:', buf.byteLength, 'bytes');
      console.log('WebSocketHandler: Buffer type:', buf.constructor.name);
      console.log('WebSocketHandler: First 20 bytes:', new Uint8Array(buf.slice(0, 20)));
      */
      // Dispatch custom event with metadata for proper parsing
      window.dispatchEvent(
        new CustomEvent("uc2:frame", {
          detail: {
            buffer: buf,
            metadata: frameMetadata,
          },
        })
      );
      // console.log('WebSocketHandler: Dispatched uc2:frame event');

      // Send acknowledgement to enable flow control
      // This tells the server we're ready for the next frame
      if (ack && typeof ack === "function") {
        ack();
      } else {
        // Fallback: emit explicit acknowledgement event
        socket.emit("frame_ack");
      }
    });

    // Listen to signals
    socket.on("signal", (data, ack) => {
      //console.log('WebSocket signal', data);
      //update redux state
      dispatch(webSocketSlice.incrementSignalCount());

      //handle signal
      const dataJson = JSON.parse(data);
      //console.log(dataJson);

      // Store frame metadata for UC2F parsing
      if (dataJson.name === "frame_meta" && dataJson.metadata) {
        // console.log('Received frame metadata:', dataJson.metadata);
        frameMetadata = dataJson.metadata;
        console.log("Frame id: ", frameMetadata.image_id);

        // Update Redux with current frame ID
        if (frameMetadata.image_id !== undefined) {
          dispatch(liveStreamSlice.setCurrentFrameId(frameMetadata.image_id));
        }
      }
      //----------------------------------------------
      else if (dataJson.name === "sigUpdateImage") {
        //console.log("sigUpdateImage", dataJson);
        //update redux state - LEGACY JPEG PATH
        if (dataJson.detectorname) {
          // Note: Legacy JPEG image handling - kept for backward compatibility
          // The new LiveViewerGL component uses binary "frame" events instead
          dispatch(liveStreamSlice.setLiveViewImage(dataJson.image)); // REMOVED

          // Track image format and set appropriate defaults based on streaming capability
          if (dataJson.format === "jpeg") {
            dispatch(liveStreamSlice.setImageFormat("jpeg"));
            // Only set defaults on first load or if values are at default
            const currentState = store.getState().liveStreamState;
            if (
              currentState.minVal === 0 &&
              (currentState.maxVal === 65535 || currentState.maxVal === 32768)
            ) {
              // Set initial defaults for JPEG
              dispatch(liveStreamSlice.setMinVal(0));
              dispatch(liveStreamSlice.setMaxVal(255));
            }
          } else {
            // Binary streaming - use 16-bit range
            dispatch(liveStreamSlice.setImageFormat(dataJson.format || "raw"));
            const currentState = store.getState().liveStreamState;
            if (
              currentState.minVal === 0 &&
              currentState.maxVal === 65535 &&
              currentState.backendCapabilities.binaryStreaming
            ) {
              // Set default range for binary streaming (common 16-bit range)
              dispatch(liveStreamSlice.setMinVal(0));
              dispatch(liveStreamSlice.setMaxVal(32768));
            }
          }

          // Update pixel size if available
          if (dataJson.pixelsize) {
            dispatch(liveStreamSlice.setPixelSize(dataJson.pixelsize));
          }

          // Track latency if server timestamp is available
          if (dataJson.server_timestamp) {
            const latency =
              (Date.now() / 1000 - dataJson.server_timestamp) * 1000; // Convert to ms
            dispatch(liveStreamSlice.updateLatency(latency));
            // Log every 30th frame to avoid spam
            const currentState = store.getState().liveStreamState;
            if (currentState.stats.frameCount % 30 === 0) {
              console.log(
                `Frame latency: ${latency.toFixed(
                  1
                )}ms (avg: ${currentState.stats.avg_latency_ms.toFixed(1)}ms)`
              );
            }
          }

          // Send acknowledgement for JPEG frames to enable flow control
          if (ack && typeof ack === "function") {
            ack();
          } else {
            socket.emit("frame_ack");
          }

          /*
        sigUpdateImage: 
        Object { 
            name: "sigUpdateImage", 
            detectorname: "WidefieldCamera", 
            pixelsize: 0.2, 
            format: "jpeg", 
            image: "................Base64.encodede.image......." 
        }
        */
          //----------------------------------------------
        }
      } else if (dataJson.name === "sigHistogramComputed") {
        //console.log("sigHistogramComputed", dataJson);
        // Handle histogram data similar to image updates
        if (dataJson.args && dataJson.args.p0 && dataJson.args.p1) {
          dispatch(
            liveStreamSlice.setHistogramData({
              x: dataJson.args.p0, // units
              y: dataJson.args.p1, // hist
            })
          );
        }
        //----------------------------------------------
      } else if (dataJson.name === "sigExperimentWorkflowUpdate") {
        //Args: {"arg0":{"status":"completed","step_id":0,"name":"Move to point 0","total_step_number":2424}}
        console.log("sigExperimentWorkflowUpdate", dataJson);

        dispatch(experimentStateSlice.setStatus(dataJson.args.arg0.status));
        dispatch(experimentStateSlice.setStepID(dataJson.args.arg0.step_id));
        dispatch(experimentStateSlice.setStepName(dataJson.args.arg0.name));
        dispatch(
          experimentStateSlice.setTotalSteps(
            dataJson.args.arg0.total_step_number
          )
        );
      } else if (dataJson.name === "sigExperimentImageUpdate") {
        console.log("sigExperimentImageUpdate", dataJson);

        // update from tiled view
        dispatch(tileStreamSlice.setTileViewImage(dataJson.image));
      } else if (dataJson.name === "sigObjectiveChanged") {
        console.log("sigObjectiveChanged", dataJson);
        //update redux state
        // TODO add check if parameter exists
        // TODO check if this works
        dispatch(objectiveSlice.setPixelSize(dataJson.args.p0.pixelsize));
        dispatch(objectiveSlice.setNA(dataJson.args.p0.NA));
        dispatch(
          objectiveSlice.setMagnification(dataJson.args.p0.magnification)
        );
        dispatch(
          objectiveSlice.setObjectiveName(dataJson.args.p0.objectiveName)
        );
        dispatch(objectiveSlice.setFovX(dataJson.args.p0.FOV[0]));
        dispatch(objectiveSlice.setFovY(dataJson.args.p0.FOV[1]));

        /*  data:
        Args: {"p0":0.2,"p1":0.5,"p2":10,"p3":"10x","p4":100,"p5":100}
        sigObjectiveChanged = Signal(float, float, float, str, float, float) 
              # pixelsize, NA, magnification, objectiveName, FOVx, FOVy
        */
        //----------------------------------------------
      } else if (dataJson.name === "sigUpdateMotorPosition") {
        //console.log("sigUpdateMotorPosition", dataJson);
        //parse
        try {
          const parsedArgs = dataJson.args.p0;
          const positionerKeys = Object.keys(parsedArgs);

          if (positionerKeys.length > 0) {
            const key = positionerKeys[0];
            const correctedPositions = parsedArgs[key];

            //update redux state
            dispatch(
              positionSlice.setPosition(
                Object.fromEntries(
                  Object.entries({
                    x: correctedPositions.X,
                    y: correctedPositions.Y,
                    z: correctedPositions.Z,
                    a: correctedPositions.A,
                  }).filter(([_, value]) => value !== undefined) //Note: filter out undefined values
                )
              )
            );
          }
        } catch (error) {
          console.error("sigUpdateMotorPosition", error);
        }
        //----------------------------------------------
      } else if (dataJson.name === "sigUpdateOMEZarrStore") {
        console.log("sigUpdateOMEZarrStore", dataJson);
        //update redux state
        dispatch(omeZarrSlice.setZarrUrl(dataJson.args.p0));
        dispatch(omeZarrSlice.tileArrived());
      } else if (dataJson.name === "sigNSTORMImageAcquired") {
        //console.log("sigNSTORMImageAcquired", dataJson);
        // Update STORM frame count - expected p0 to be frame number
        if (dataJson.args && dataJson.args.p0 !== undefined) {
          dispatch({
            type: "storm/setCurrentFrameNumber",
            payload: dataJson.args.p0,
          });
        }
      } else if (dataJson.name === "sigSTORMReconstructionUpdated") {
        //console.log("sigSTORMReconstructionUpdated", dataJson);
        // Update STORM reconstructed image
        if (dataJson.args && dataJson.args.p0) {
          dispatch({
            type: "storm/setReconstructedImage",
            payload: dataJson.args.p0,
          });
        }
      } else if (dataJson.name === "sigSTORMReconstructionStarted") {
        //console.log("sigSTORMReconstructionStarted", dataJson);
        dispatch({ type: "storm/setIsReconstructing", payload: true });
      } else if (dataJson.name === "sigSTORMReconstructionStopped") {
        //console.log("sigSTORMReconstructionStopped", dataJson);
        dispatch({ type: "storm/setIsReconstructing", payload: false });
      } else if (dataJson.name === "sigUpdatedSTORMReconstruction") {
        //console.log("sigUpdatedSTORMReconstruction", dataJson);
        // Handle localization data - expected p0 to be an object with x, y, and intensity arrays
        if (dataJson.args && dataJson.args.p0) {
          try {
            let localizationsData = dataJson.args.p0;

            // If p0 is a string, parse it first
            if (typeof localizationsData === "string") {
              localizationsData = JSON.parse(localizationsData);
            }

            // Check if it has the new format with separate x, y, intensity arrays
            if (
              localizationsData.x &&
              localizationsData.y &&
              Array.isArray(localizationsData.x) &&
              Array.isArray(localizationsData.y)
            ) {
              const localizations = [];
              const minLength = Math.min(
                localizationsData.x.length,
                localizationsData.y.length
              );

              for (let i = 0; i < minLength; i++) {
                localizations.push({
                  x: localizationsData.x[i],
                  y: localizationsData.y[i],
                  intensity: localizationsData.intensity
                    ? localizationsData.intensity[i]
                    : 0,
                });
              }

              dispatch({
                type: "storm/addLocalizations",
                payload: localizations,
              });
            } else if (Array.isArray(localizationsData)) {
              // Fallback for old format - array of objects
              const localizations = localizationsData.map((loc) => ({
                x: loc.x || loc[0],
                y: loc.y || loc[1],
                intensity: loc.intensity || 0,
              }));
              dispatch({
                type: "storm/addLocalizations",
                payload: localizations,
              });
            }
          } catch (e) {
            console.warn("Failed to parse STORM localization data:", e);
          }
        }
      } else if (dataJson.name === "sigFocusValueUpdate") {
        console.log("sigFocusValueUpdate received:", dataJson); // Debug log
        // Handle focus value updates - updated for new library format
        try {
          // Try the new format first (direct object)
          let focusData = dataJson.args || {};

          // If args is available but not an object, try args.p0
          if (dataJson.args.p0) {
            focusData = dataJson.args.p0 || {};
          }

          console.log("Parsed focus data:", focusData); // Debug log

          // Support both old and new formats
          const focusValue = focusData.focus_value || focusData.focusValue || 0;
          const currentFocusMotorPosition = focusData.current_position || 0;
          const setPointSignal =
            focusData.focus_setpoint || focusData.setPointSignal || 0;
          const timestamp = focusData.timestamp || Date.now();

          console.log("Dispatching focus values:", {
            focusValue,
            setPointSignal,
            currentFocusMotorPosition,
            timestamp,
          }); // Debug log

          dispatch(
            focusLockSlice.addFocusValue({
              focusValue,
              setPointSignal,
              currentFocusMotorPosition,
              timestamp,
            })
          );
        } catch (error) {
          console.error("Error parsing focus value signal:", error);
        }
      } else if (dataJson.name === "sigFocusLockStateChanged") {
        //console.log("sigFocusLockStateChanged", dataJson);
        // Handle focus lock state changes - updated for new library format
        try {
          // Try to get state data from args directly or args.p0
          let stateData = dataJson.args || {};
          if (dataJson.args && dataJson.args.p0) {
            stateData = dataJson.args.p0;
          }

          if (typeof stateData === "object") {
            if (stateData.is_locked !== undefined) {
              dispatch(focusLockSlice.setFocusLocked(stateData.is_locked));
            }
            if (stateData.is_calibrating !== undefined) {
              dispatch(
                focusLockSlice.setIsCalibrating(stateData.is_calibrating)
              );
            }
            if (stateData.is_measuring !== undefined) {
              dispatch(focusLockSlice.setIsMeasuring(stateData.is_measuring));
            }
          }
        } catch (error) {
          console.error("Error parsing focus lock state signal:", error);
        }
      } else if (dataJson.name === "sigCalibrationProgress") {
        //console.log("sigCalibrationProgress", dataJson);
        // Handle calibration progress updates - updated for new library format
        try {
          // Try to get progress data from args directly or args.p0
          let progressData = dataJson.args || {};
          if (dataJson.args && dataJson.args.p0) {
            progressData = dataJson.args.p0;
          }

          if (typeof progressData === "object") {
            // Add calibration progress state to Redux if needed
            console.log("Calibration progress:", progressData);
            // TODO: Add calibration progress to Redux state if needed
          }
        } catch (error) {
          console.error("Error parsing calibration progress signal:", error);
        }
      } else if (dataJson.name === "sigGameState") {
        // Handle maze game state updates
        try {
          const gameState = dataJson.args?.p0 || dataJson.args || {};
          dispatch(mazeGameSlice.setGameState(gameState));
        } catch (error) {
          console.error("Error parsing game state signal:", error);
        }
      } else if (dataJson.name === "sigCounterUpdated") {
        // Handle maze game counter updates
        try {
          const counter =
            dataJson.args?.p0 ?? dataJson.counter ?? dataJson.value ?? 0;
          dispatch(mazeGameSlice.setCounter(counter));
        } catch (error) {
          console.error("Error parsing counter signal:", error);
        }
      } else if (dataJson.name === "sigPreviewUpdated") {
        // Handle maze game preview updates
        try {
          if (dataJson.args.p0) {
            let rawImage = dataJson.args.p0.jpeg_b64;

            // Remove the b'...' wrapper if present
            if (
              typeof rawImage === "string" &&
              rawImage.startsWith("b'") &&
              rawImage.endsWith("'")
            ) {
              rawImage = rawImage.slice(2, -1);

              // Convert escaped hex sequences (\xHH) to actual bytes
              const bytes = [];
              let i = 0;
              while (i < rawImage.length) {
                if (rawImage[i] === "\\" && rawImage[i + 1] === "x") {
                  // Parse hex escape sequence
                  const hex = rawImage.slice(i + 2, i + 4);
                  bytes.push(parseInt(hex, 16));
                  i += 4;
                } else if (rawImage[i] === "\\" && rawImage[i + 1] === "r") {
                  bytes.push(13); // \r
                  i += 2;
                } else if (rawImage[i] === "\\" && rawImage[i + 1] === "n") {
                  bytes.push(10); // \n
                  i += 2;
                } else {
                  bytes.push(rawImage.charCodeAt(i));
                  i += 1;
                }
              }

              // Convert bytes to Base64
              const uint8Array = new Uint8Array(bytes);
              let binaryString = "";
              for (let i = 0; i < uint8Array.length; i++) {
                binaryString += String.fromCharCode(uint8Array[i]);
              }
              const base64 = btoa(binaryString);

              dispatch(
                mazeGameSlice.setPreviewImage(`data:image/png;base64,${base64}`)
              );
            } else {
              // If it's already a base64 string, use it directly
              dispatch(
                mazeGameSlice.setPreviewImage(
                  `data:image/png;base64,${rawImage}`
                )
              );
            }
          }
        } catch (error) {
          console.error("Error processing preview image:", error);
        }
      }
      // Name: sigUpdatedSTORMReconstruction => Args: {"p0":[[252.2014923095703,298.37579345703125,2814.840087890625,206508.3125,1.037859320640564]}
      else {
        //console.warn("WebSocket: Unhandled signal from socket:", dataJson.name);
        //console.warn(dataJson);
      }
    });

    socket.on("broadcast", (data) => {
      console.log("WebSocket broadcast");
    });

    socket.onerror = (error) => {
      console.error("WebSocket Error: ", error);
    };

    socket.onclose = () => {
      console.log("WebSocket closed");
      //update redux state
      dispatch(webSocketSlice.resetState());
    };

    //##################################################################################
    return () => {
      socket.off("signal");
      socket.off("broadcast");
      socket.close();
    };
  }, [dispatch, connectionSettingsState]);

  // Global UC2 connection monitoring (periodic checks)
  useEffect(() => {
    // Clear any existing interval
    if (connectionCheckRef.current) {
      clearInterval(connectionCheckRef.current);
    }

    // Initial connection check
    checkUc2Connection();

    // Set up periodic monitoring
    connectionCheckRef.current = setInterval(() => {
      checkUc2Connection();
    }, 10000); // Every 10 seconds

    return () => {
      if (connectionCheckRef.current) {
        clearInterval(connectionCheckRef.current);
      }
    };
  }, [checkUc2Connection]); // Now using the memoized function

  return null; // This component does not render anything, just manages the WebSocket
};

export default WebSocketHandler;

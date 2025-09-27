import React, { useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";
import * as connectionSettingsSlice from "../state/slices/ConnectionSettingsSlice.js";
import * as webSocketSlice from "../state/slices/WebSocketSlice.js";
import * as experimentStateSlice from "../state/slices/ExperimentStateSlice.js";
import * as liveStreamSlice from "../state/slices/LiveStreamSlice.js";
import * as tileStreamSlice from "../state/slices/TileStreamSlice.js";
import * as positionSlice from "../state/slices/PositionSlice.js";
import * as objectiveSlice from "../state/slices/ObjectiveSlice.js";
import * as omeZarrSlice from "../state/slices/OmeZarrTileStreamSlice.js";
import * as focusLockSlice from "../state/slices/FocusLockSlice.js";

import { io } from "socket.io-client";

//##################################################################################
const WebSocketHandler = () => {
  console.log("WebSocket WebSocketHandler");
  // redux dispatcher
  const dispatch = useDispatch();

  // Access global Redux state
  const connectionSettingsState = useSelector(
    connectionSettingsSlice.getConnectionSettingsState
  );

  //##################################################################################
  useEffect(() => {
    //create the socket
    const adress =
      connectionSettingsState.ip + ":" + connectionSettingsState.websocketPort;
    console.log("WebSocket", adress);
    const socket = io(adress, {
      transports: ["websocket"],
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

    // Listen for binary frame events (UC2F packets)
    socket.on("frame", (buf) => {
      // Dispatch custom event to viewer components without storing in Redux
      window.dispatchEvent(new CustomEvent("uc2:frame", { detail: buf }));
    });

    // Listen to signals
    socket.on("signal", (data) => {
      //console.log('WebSocket signal', data);
      //update redux state
      dispatch(webSocketSlice.incrementSignalCount());

      //handle signal
      const dataJson = JSON.parse(data);
      //console.log(dataJson);
      //----------------------------------------------
      if (dataJson.name === "sigUpdateImage") {
        //console.log("sigUpdateImage", dataJson);
        //update redux state - LEGACY JPEG PATH
        if (dataJson.detectorname) {
          // Note: Legacy JPEG image handling - kept for backward compatibility
          // The new LiveViewerGL component uses binary "frame" events instead
          // dispatch(liveStreamSlice.setLiveViewImage(dataJson.image)); // REMOVED
          
          // Update pixel size if available
          if (dataJson.pixelsize) {
            dispatch(liveStreamSlice.setPixelSize(dataJson.pixelsize));
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
          dispatch(liveStreamSlice.setHistogramData({
            x: dataJson.args.p0, // units
            y: dataJson.args.p1  // hist
          }));
        }
        //----------------------------------------------
      } else if (
        dataJson.name == "sigExperimentWorkflowUpdate") {
          //Args: {"arg0":{"status":"completed","step_id":0,"name":"Move to point 0","total_step_number":2424}}
          console.log("sigExperimentWorkflowUpdate", dataJson);
          
          dispatch(
            experimentStateSlice.setStatus(dataJson.args.arg0.status)
          );
          dispatch(
            experimentStateSlice.setStepID(dataJson.args.arg0.step_id)
          );
          dispatch(
            experimentStateSlice.setStepName(dataJson.args.arg0.name)
          );
          dispatch(
            experimentStateSlice.setTotalSteps(
              dataJson.args.arg0.total_step_number
            )
          );
        }
      else if (dataJson.name == "sigExperimentImageUpdate") {
        console.log("sigExperimentImageUpdate", dataJson);

        // update from tiled view
        dispatch(tileStreamSlice.setTileViewImage(dataJson.image));
      } else if (dataJson.name == "sigObjectiveChanged") {
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
      } else if (dataJson.name == "sigUpdateMotorPosition") {
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
      } else if (dataJson.name == "sigUpdateOMEZarrStore") {
        console.log("sigUpdateOMEZarrStore", dataJson);
        //update redux state
        dispatch(omeZarrSlice.setZarrUrl(dataJson.args.p0));
        dispatch(omeZarrSlice.tileArrived());
      } else if (dataJson.name == "sigNSTORMImageAcquired") {
        //console.log("sigNSTORMImageAcquired", dataJson);
        // Update STORM frame count - expected p0 to be frame number
        if (dataJson.args && dataJson.args.p0 !== undefined) {
          dispatch({ type: 'storm/setCurrentFrameNumber', payload: dataJson.args.p0 });
        }
      } else if (dataJson.name == "sigSTORMReconstructionUpdated") {
        //console.log("sigSTORMReconstructionUpdated", dataJson);
        // Update STORM reconstructed image
        if (dataJson.args && dataJson.args.p0) {
          dispatch({ type: 'storm/setReconstructedImage', payload: dataJson.args.p0 });
        }
      } else if (dataJson.name == "sigSTORMReconstructionStarted") {
        //console.log("sigSTORMReconstructionStarted", dataJson);
        dispatch({ type: 'storm/setIsReconstructing', payload: true });
      } else if (dataJson.name == "sigSTORMReconstructionStopped") {
        //console.log("sigSTORMReconstructionStopped", dataJson);
        dispatch({ type: 'storm/setIsReconstructing', payload: false });
      } else if (dataJson.name == "sigUpdatedSTORMReconstruction") {
        //console.log("sigUpdatedSTORMReconstruction", dataJson);
        // Handle localization data - expected p0 to be an object with x, y, and intensity arrays
        if (dataJson.args && dataJson.args.p0) {
          try {
            let localizationsData = dataJson.args.p0;
            
            // If p0 is a string, parse it first
            if (typeof localizationsData === 'string') {
              localizationsData = JSON.parse(localizationsData);
            }
            
            // Check if it has the new format with separate x, y, intensity arrays
            if (localizationsData.x && localizationsData.y && Array.isArray(localizationsData.x) && Array.isArray(localizationsData.y)) {
              const localizations = [];
              const minLength = Math.min(localizationsData.x.length, localizationsData.y.length);
              
              for (let i = 0; i < minLength; i++) {
                localizations.push({
                  x: localizationsData.x[i],
                  y: localizationsData.y[i],
                  intensity: localizationsData.intensity ? localizationsData.intensity[i] : 0
                });
              }
              
              dispatch({ type: 'storm/addLocalizations', payload: localizations });
            } else if (Array.isArray(localizationsData)) {
              // Fallback for old format - array of objects
              const localizations = localizationsData.map(loc => ({
                x: loc.x || loc[0],
                y: loc.y || loc[1],
                intensity: loc.intensity || 0
              }));
              dispatch({ type: 'storm/addLocalizations', payload: localizations });
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
          const setPointSignal = focusData.focus_setpoint || focusData.setPointSignal || 0;
          const timestamp = focusData.timestamp || Date.now();
          
          console.log("Dispatching focus values:", { focusValue, setPointSignal, currentFocusMotorPosition, timestamp }); // Debug log
          
          dispatch(focusLockSlice.addFocusValue({
            focusValue,
            setPointSignal,
            currentFocusMotorPosition,
            timestamp
          }));
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
          
          if (typeof stateData === 'object') {
            if (stateData.is_locked !== undefined) {
              dispatch(focusLockSlice.setFocusLocked(stateData.is_locked));
            }
            if (stateData.is_calibrating !== undefined) {
              dispatch(focusLockSlice.setIsCalibrating(stateData.is_calibrating));
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
          
          if (typeof progressData === 'object') {
            // Add calibration progress state to Redux if needed
            console.log("Calibration progress:", progressData);
            // TODO: Add calibration progress to Redux state if needed
          }
        } catch (error) {
          console.error("Error parsing calibration progress signal:", error);
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

  return null; // This component does not render anything, just manages the WebSocket
};

export default WebSocketHandler;

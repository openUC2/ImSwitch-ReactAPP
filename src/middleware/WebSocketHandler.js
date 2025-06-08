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

    // Listen to signals
    socket.on("signal", (data) => {
      //console.log('WebSocket signal', data);
      //update redux state
      dispatch(webSocketSlice.incrementSignalCount());

      //handle signal
      const dataJson = JSON.parse(data);
      //console.log(dataJson);
      //----------------------------------------------
      if (dataJson.name == "sigUpdateImage") {
        //console.log("sigUpdateImage", dataJson);
        //update redux state
        if (dataJson.detectorname) {
          dispatch(liveStreamSlice.setLiveViewImage(dataJson.image));
          
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
        console.log("sigUpdateMotorPosition", dataJson);
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
      }
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

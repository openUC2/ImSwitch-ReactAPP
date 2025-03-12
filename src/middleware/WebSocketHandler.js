import React, { useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";
import * as connectionSettingsSlice from "../state/slices/ConnectionSettingsSlice.js";
import * as webSocketSlice from "../state/slices/WebSocketSlice.js";
import * as liveStreamSlice from "../state/slices/LiveStreamSlice.js";
import * as positionSlice from "../state/slices/PositionSlice.js";
import * as objectiveSlice from "../state/slices/ObjectiveSlice.js";

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
        dispatch(liveStreamSlice.setLiveViewImage(dataJson.image));
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
      } else if (dataJson.name == "sigObjectiveChanged") {
        console.log("sigObjectiveChanged", dataJson);
        //update redux state 
        // TODO add check if parameter exists
        // TODO check if this works
        dispatch(objectiveSlice.setPixelSize(dataJson.args.p0));
        dispatch(objectiveSlice.setNA(dataJson.args.p1)); 
        dispatch(objectiveSlice.setMagnification(dataJson.args.p2));
        dispatch(objectiveSlice.setObjectiveName(dataJson.args.p3)); 
        dispatch(objectiveSlice.setFovX(dataJson.args.p4));
        dispatch(objectiveSlice.setFovY(dataJson.args.p5));

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
      } else {
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

import React, { useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";
import * as connectionSettingsSlice from "../state/slices/ConnectionSettingsSlice.js";
import * as webSocketSlice from "../state/slices/WebSocketSlice.js";
import * as liveStreamSlice from "../state/slices/LiveStreamSlice.js";
import * as positionSlice from "../state/slices/PositionSlice.js";

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
      if (dataJson.name == "sigUpdateImage") {
        //----------------------------------
        //console.log("sigUpdateImage");
        //update redux state
        dispatch(liveStreamSlice.setLiveViewImage(dataJson.image));
      } else if (dataJson.name == "sigUpdateMotorPosition") {
        //----------------------------------
        //
        console.log("sigUpdateMotorPosition", dataJson);
        //parse
        //update redux state
        try {
          const parsedArgs = dataJson.args.p0;
          const positionerKeys = Object.keys(parsedArgs);

          if (positionerKeys.length > 0) {
            const key = positionerKeys[0];
            const correctedPositions = parsedArgs[key];

            dispatch(
                positionSlice.setPosition({
                x: correctedPositions.X,
                y: correctedPositions.Y,
                z: correctedPositions.Z,
                a: correctedPositions.A,
              })
            );
          }
        } catch (error) {
          console.error("sigUpdateMotorPosition", error);
          /*
          WebSocketHandler.js:75 Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'X')
            at Socket.<anonymous> (WebSocketHandler.js:75:1)
            at __webpack_modules__../node_modules/@socket.io/component-emitter/lib/esm/index.js.Emitter.emit (index.js:136:1)
            at Socket.emitEvent (socket.js:538:1)
            at Socket.onevent (socket.js:525:1)
            at Socket.onpacket (socket.js:495:1)
            at __webpack_modules__../node_modules/@socket.io/component-emitter/lib/esm/index.js.Emitter.emit (index.js:136:1)
            at manager.js:209:1

        fetchGetExperimentStatus.js:10 
        */
        }
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

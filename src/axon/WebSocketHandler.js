import React, { useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";
import * as webSocketSettingsSlice from "../state/slices/WebSocketSettingsSlice.js";
import * as webSocketConnectionSlice from "../state/slices/WebSocketConnectionSlice.js";
import * as liveStreamSlice from "../state/slices/LiveStreamSlice.js";
import * as hardwareSlice from "../state/slices/HardwareSlice.js";

import { io } from "socket.io-client";

//##################################################################################
const WebSocketHandler = () => {
    console.log("WebSocket WebSocketHandler");
  // redux dispatcher
  const dispatch = useDispatch();

  // Access global Redux state
  const webSocketSettingsState = useSelector(
    webSocketSettingsSlice.getWebSocketSettingsState
  );
  const webSocketConnectionState = useSelector(
    webSocketConnectionSlice.getWebSocketConnectionState
  );
  const liveStreamState = useSelector(liveStreamSlice.getLiveStreamState);
  const hardwareState = useSelector(hardwareSlice.getHardwareState);

  //##################################################################################
  useEffect(() => {
    //create the socket
    const adress =
      webSocketSettingsState.ip + ":" + webSocketSettingsState.port;
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
      dispatch(webSocketConnectionSlice.setConnected(true));
    });

    socket.on("signal", (data) => {
      //console.log('WebSocket signal', data);
      //update redux state
      dispatch(webSocketConnectionSlice.incrementSignalCount());

      //handle signal
      const dataJson = JSON.parse(data);
      //console.log(dataJson);
      if (dataJson.name == "sigUpdateImage") {
        //console.log("sigUpdateImage");
        //update redux state
        dispatch(liveStreamSlice.setLiveViewImage(dataJson.image));
      } else if (dataJson.name == "sigImageUpdated") {
        //console.log("sigImageUpdated");
        //update redux state
        dispatch(liveStreamSlice.setLiveViewImage(dataJson.image));
      } else if (dataJson.name == "sigUpdateMotorPosition") {
        //
        console.log("sigUpdateMotorPosition");
        //parse
        const p0Object = JSON.parse(dataJson.args.p0.replace(/'/g, '"'));
        //update redux state
        dispatch(
          hardwareSlice.setPosition({
            x: p0Object.VirtualStage.X,
            y: p0Object.VirtualStage.Y,
            z: p0Object.VirtualStage.Z,
            a: p0Object.VirtualStage.A,
          })
        );
      } else {
        console.warn("WebSocket: Unhandled signal from socket:", dataJson.name);
        console.warn(dataJson);
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
      dispatch(webSocketConnectionSlice.resetState());
    };

    //##################################################################################
    return () => {
      socket.off("signal");
      socket.off("broadcast");
      socket.close();
    };
  }, [dispatch]);

  return null; // This component does not render anything, just manages the WebSocket
};

export default WebSocketHandler;

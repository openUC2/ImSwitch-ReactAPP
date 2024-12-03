import React, { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);
const wsPort = 8002;

export const WebSocketProvider = ({ hostIP, children }) => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialisiere die Socket.IO-Verbindung
    const socket = io(`${hostIP}:${wsPort}`, {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    // Verbindungsereignisse handhaben
    socket.on("connect", () => {
      console.log("Socket.IO connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket.IO disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
    });

    // Aufräumen bei Unmount
    return () => {
      socket.disconnect();
    };
  }, [hostIP]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export const useWebSocket = () => {
  return useContext(SocketContext);
};
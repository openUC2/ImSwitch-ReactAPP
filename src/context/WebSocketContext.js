import React, { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";

// Create a context for Socket.IO
const SocketContext = createContext(null);
const wsPort = 8002;

export const WebSocketProvider = ({ hostIP, children }) => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize the Socket.IO connection
    const socket = io(`${hostIP}:${wsPort}`, {
      transports: ["websocket"], // Use WebSocket transport
    });

    socketRef.current = socket;

    // Handle connection events
    socket.on("connect", () => {
      console.log("Socket.IO connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket.IO disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

// Hook to use the Socket.IO instance
export const useWebSocket = () => useContext(SocketContext);

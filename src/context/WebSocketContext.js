// WebSocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';

const WebSocketContext = createContext(null);
const wsport = 8002;

export const WebSocketProvider = ({ hostIP, hostPort, children }) => {

  const [serverUrl, setServerUrl] = useState(`${hostIP}:${wsport}/ws`);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    console.log("Connecting to WebSocket at", serverUrl);
    const ws = new WebSocket(serverUrl);

    ws.onopen = () => console.log("WebSocket connected to", serverUrl);
    ws.onmessage = (event) => console.log("Message received:", event.data);
    ws.onclose = () => console.log("WebSocket disconnected.");
    ws.onerror = (error) => console.error("WebSocket error:", error);

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []); // Dependency array left empty to avoid reconnection loops

  return (
    <WebSocketContext.Provider value={socket}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);

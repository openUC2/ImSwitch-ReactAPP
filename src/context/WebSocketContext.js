// WebSocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';

const WebSocketContext = createContext(null);
const wsport = 8002;

export const WebSocketProvider = ({ hostIP, hostPort, children }) => {

  const [socket, setSocket] = useState(null);
  const [serverUrl, setServerUrl] = "https://0.0.0.0:8002/ws";
  

  useEffect(() => {
    const wsUrl = "https://0.0.0.0:8002/ws" ; //`ws://${hostIP.replace(/^https?:\/\//, '')}:${wsport}/ws`;
    console.log("Connecting to WebSocket at", wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => console.log("WebSocket connected to", wsUrl);
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

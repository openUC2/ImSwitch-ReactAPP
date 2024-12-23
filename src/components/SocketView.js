import React, { useEffect, useState } from "react";
import { useWebSocket } from "../context/WebSocketContext";

const SocketView = () => {
  const [messages, setMessages] = useState([]);
  const socket = useWebSocket();

  useEffect(() => {
    if (!socket) return;

    // Listen for server messages
    socket.on("signal", (data) => {
      setMessages((prev) => [...prev, data]);
    });
    
    // Listen for broadcast messages
    socket.on("broadcast", (data) => {
      setMessages((prev) => [...prev, data.message]);
    });

    return () => {
      // Clean up listeners
      socket.off("server_message");
      socket.off("broadcast");
    };
  }, [socket]);

  return (
    <div>
      <h1>Socket.IO Messages</h1>
      {messages.map((msg, idx) => (
        <p key={idx}>{msg}</p>
      ))}
    </div>
  );
};

export default SocketView;

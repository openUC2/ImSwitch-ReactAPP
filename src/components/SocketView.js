import React, { useEffect, useState } from "react";
import { useWebSocket } from "../context/WebSocketContext";

const SocketView = () => {
  const [messages, setMessages] = useState([]);
  const socket = useWebSocket();

  useEffect(() => {
    if (!socket) return;

    // Listen for server messages
    socket.on("signal", (data) => {
      data = JSON.parse(data);
      if ((data.name === "sigImageUpdated") || (data.name === "sigUpdateImage")){
        return;
      }
      setMessages((prev) => [...prev, data]);
    });
    
    // Listen for broadcast messages
    socket.on("broadcast", (data) => {
      data = JSON.parse(data);
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("signal");
      socket.off("broadcast");
    };
  }, [socket]);

  return (
    <div>
      {messages.map((message, index) => (
        <div key={index}>
          <p>Name: {message.name}</p>
          <p>Args: {JSON.stringify(message.args)}</p>
        </div>
      ))}
    </div>
  );
};

export default SocketView;
import React from 'react'; 
import { useDispatch, useSelector } from "react-redux";
import * as webSocketStateSlice from "../state/slices/WebSocketSlice.js";

//##################################################################################
const WebSocketComponent = () => { 
    // redux dispatcher
    const dispatch = useDispatch();
  
    // Access global Redux state
    const webSocketState = useSelector(webSocketStateSlice.getWebSocketState);

//##################################################################################
  return (
    <div style={{ border: '1px solid white', padding: '10px' }}>
      <table style={{ textAlign: 'left' }}>
        <thead>
          <tr>
            <th>Label</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>IP Address</td>
            <td>{webSocketState.ip}</td>
          </tr>
          <tr>
            <td>Port</td>
            <td>{webSocketState.port}</td>
          </tr>
          <tr>
            <td>Connection</td>
            <td>{webSocketState.connected ? 'Connected' : 'Disconnected'}</td>
          </tr>
          <tr>
            <td>Signal Count</td>
            <td>{webSocketState.signalCount}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

//##################################################################################
export default WebSocketComponent;

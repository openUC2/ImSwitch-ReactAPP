import React from 'react'; 
import { useDispatch, useSelector } from "react-redux";
import * as webSocketSettingsSlice from "../state/slices/WebSocketSettingsSlice.js";
import * as webSocketConnectionSlice from "../state/slices/WebSocketConnectionSlice.js";

//##################################################################################
const WebSocketComponent = () => { 
    // redux dispatcher
    const dispatch = useDispatch();
  
    // Access global Redux state
    const webSocketSettingsState = useSelector(webSocketSettingsSlice.getWebSocketSettingsState);
    const webSocketConnectionState = useSelector(webSocketConnectionSlice.getWebSocketConnectionState);

//##################################################################################
  return (
    <div style={{ border: '1px solid white', padding: '10px' }}>
      <table style={{ textAlign: 'left' }}>
        <thead>
          <tr>
            <th>Settings</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>IP Address</td>
            <td>{webSocketSettingsState.ip}</td>
          </tr>
          <tr>
            <td>Port</td>
            <td>{webSocketSettingsState.port}</td>
          </tr>
          <thead>
            <tr>
              <th>Status</th>
              <th><div style={{ width: "16px", height: "16px", borderRadius: "100%", backgroundColor: webSocketConnectionState.connected ? "green" : "red" }}/></th>
            </tr>
          </thead>
            <tr>
            <td>Connection</td>
            <td>{webSocketConnectionState.connected ? 'Connected' : 'Disconnected'}</td> 
          </tr>
          <tr>
            <td>Signal Count</td>
            <td>{webSocketConnectionState.signalCount}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

//##################################################################################
export default WebSocketComponent;

import React from 'react';
import { useDispatch, useSelector } from "react-redux";
import * as hardwareSlice from "../state/slices/HardwareSlice.js";

const PositionViewComponent = () => {
    // redux dispatcher
    const dispatch = useDispatch();
  
    // Access global Redux state
    const hardwareState = useSelector(hardwareSlice.getHardwareState);

 

  return (
    <div
      style={{
        border: "1px solid #eee",
        textAlign: "left",
        padding: "10px",
        margin: "0px", 
        //minWidth: "600px", 
      }}
    >
        {/* Header */}
        <h4 style={{ margin: "0", padding: "0" }}>Camera Position</h4>
        
        {/* data */}
        <table>
          <tbody>
            <tr>
              <td>x</td>
              <td>{hardwareState.position.x}</td>
            </tr>
            <tr>
              <td>y</td>
              <td>{hardwareState.position.y}</td>
            </tr>
            <tr>
              <td>z</td>
              <td>{hardwareState.position.z}</td>
            </tr>
            <tr>
              <td>a</td>
              <td>{hardwareState.position.a}</td>
            </tr>
          </tbody>
        </table>
    </div>
  );
};

export default PositionViewComponent;

import React from 'react';
import { useDispatch, useSelector } from "react-redux";
import * as liveViewSlice from "../state/slices/LiveStreamSlice.js";

const LiveViewComponent = () => {
    // redux dispatcher
    const dispatch = useDispatch();
  
    // Access global Redux state
    const liveStreamState = useSelector(liveViewSlice.getLiveStreamState);

  return (
    <div style={{ border: '1px solid white' }}>
      {/* Conditionally render image or canvas based on whether the hardwareState.liveViewImage is available */}
      {liveStreamState.liveViewImage ? (
        <img src={`data:image/jpeg;base64,${liveStreamState.liveViewImage}`} alt="Base64 Image" style={{ width: '100%', height: 'auto' }}/>
      ) : (
        <p>Loading image...</p>
      )} 

    </div>
  );
};

export default LiveViewComponent;

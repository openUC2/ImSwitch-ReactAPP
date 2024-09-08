// src/context/LiveWidgetContext.js
import React, { createContext, useState } from 'react';

// Create the context
export const LiveWidgetContext = createContext();

// Create a provider component
export const LiveWidgetProvider = ({ children }) => {
  // Define your global state here
  const [isStreamRunning, setStreamRunning] = useState(false);
  const [sliderIllu1Value, setIllu1Slider] = useState(0);
  const [sliderIllu2Value, setIllu2Slider] = useState(0);
  const [sliderIllu3Value, setIllu3Slider] = useState(0);
  const [isIllumination1Checked, setisIllumination1Checked] = useState(false);
  const [isIllumination2Checked, setisIllumination2Checked] = useState(false);
  const [isIllumination3Checked, setisIllumination3Checked] = useState(false);
  
  // Pass down the state and state-updating functions
  return (
    <LiveWidgetContext.Provider
      value={{
        isStreamRunning,
        setStreamRunning,
        sliderIllu1Value,
        setIllu1Slider,
        sliderIllu2Value,
        setIllu2Slider,
        sliderIllu3Value,
        setIllu3Slider,
        isIllumination1Checked,
        setisIllumination1Checked,
        isIllumination2Checked,
        setisIllumination2Checked,
        isIllumination3Checked,
        setisIllumination3Checked,
      }}
    >
      {children}
    </LiveWidgetContext.Provider>
  );
};

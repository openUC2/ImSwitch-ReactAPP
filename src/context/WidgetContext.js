import React, { useState, useContext } from "react";

const WidgetContext = React.createContext();

export function useWidgetContext() {
  return useContext(WidgetContext);
}

export function WidgetContextProvider({ children }) {
  const [sliderValue, setSliderValue] = useState(0);

  return (
    <WidgetContext.Provider
      value={{
        sliderValue,
        setSliderValue,
      }}
    >
      {children}
    </WidgetContext.Provider>
  );
}

import React from 'react';
import { createContext, useContext, useState } from "react";

export const ScreenContext = createContext()

export const ScreenContextProvider = ({ children, initialState, store }) => {
  const [scale, setScale] = useState(initialState?.scale ?? 1);
  const [position, setPosition] = useState(initialState?.position ?? { x: 0, y: 0 });

  return (
    <ScreenContext.Provider value={{ scale, setScale, position, setPosition }}>
      {children}
    </ScreenContext.Provider>
  );
}

export const useScreenContext = () => {
  const { scale, setScale, position, setPosition } = useContext(ScreenContext);

  return { scale, setScale, position, setPosition };
}
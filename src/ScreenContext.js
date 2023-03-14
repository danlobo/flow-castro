import { createContext, useContext, useState } from "react";

export const ScreenContext = createContext()

export const ScreenContextProvider = ({ children }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

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
import React from 'react';
import { createContext, useContext, useState } from "react";

export const DragContext = createContext(null)

export const DragContextProvider = ({ children }) => {
  const [dragInfo, setDragInfo] = useState(null);

  return (
    <DragContext.Provider value={{ dragInfo, setDragInfo }}>
      {children}
    </DragContext.Provider>
  );
}

export const useDragContext = () => {
  const { dragInfo, setDragInfo } = useContext(DragContext);

  return { dragInfo, setDragInfo };
}
import React from 'react';
import { createContext, useContext, useState } from "react";

export const DragContext = createContext(null)

/**
 * `dragInfo` is a connection being dragged out of a port.
 * `pendingConnection` is a port that was tapped (or clicked) and is waiting for
 * a second tap on a compatible port - the touch-friendly way to connect, which
 * leaves the canvas free to pan and zoom in between.
 */
export const DragContextProvider = ({ children }) => {
  const [dragInfo, setDragInfo] = useState(null);
  const [pendingConnection, setPendingConnection] = useState(null);

  return (
    <DragContext.Provider
      value={{ dragInfo, setDragInfo, pendingConnection, setPendingConnection }}
    >
      {children}
    </DragContext.Provider>
  );
}

export const useDragContext = () => {
  const { dragInfo, setDragInfo, pendingConnection, setPendingConnection } =
    useContext(DragContext);

  return { dragInfo, setDragInfo, pendingConnection, setPendingConnection };
}

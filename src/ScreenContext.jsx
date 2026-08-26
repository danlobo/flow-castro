import React from "react";
import { createContext, useContext, useMemo, useRef, useState } from "react";

export const ScreenContext = createContext();

/**
 * The viewport as a ref, for readers that only need it inside an event handler.
 *
 * Panning and zooming rewrite `position` and `scale` on every frame. Anything
 * that subscribes to them through `useScreenContext` re-renders at that rate,
 * `memo` or not - and the nodes, their ports, the connectors and the comments
 * only ever read the viewport while handling a mouse event. They take it from
 * here instead, so a pan no longer re-renders the whole flow.
 */
export const ScreenViewportRefContext = createContext();

export const ScreenContextProvider = ({ children, initialState, store }) => {
  const [scale, setScale] = useState(initialState?.scale || 1);
  const [position, setPosition] = useState(
    initialState?.position || { x: 0, y: 0 },
  );

  const viewportRef = useRef({ scale, position });
  viewportRef.current = { scale, position };

  const value = useMemo(
    () => ({ scale, setScale, position, setPosition }),
    [scale, position],
  );

  return (
    <ScreenViewportRefContext.Provider value={viewportRef}>
      <ScreenContext.Provider value={value}>{children}</ScreenContext.Provider>
    </ScreenViewportRefContext.Provider>
  );
};

export const useScreenContext = () => {
  const { scale, setScale, position, setPosition } = useContext(ScreenContext);

  return { scale, setScale, position, setPosition };
};

/**
 * Returns a ref holding the current `{ scale, position }`. Reading it does not
 * subscribe the caller to pan or zoom - read `.current` when the event fires.
 */
export const useScreenViewportRef = () => useContext(ScreenViewportRefContext);

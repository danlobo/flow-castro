import React from "react";
import { DragContextProvider } from "./DragContext.jsx";
import { ScreenContextProvider } from "./ScreenContext.jsx";
import Screen from "./Screen.jsx";

function NodeContainer({
  theme,
  themes,
  state,
  readOnly = false,
  highlightedNodes,
  highlightedConnections,
  onNodeClick,
  centerOnNode,
  ...props
}) {
  return (
    <ScreenContextProvider initialState={state}>
      <DragContextProvider>
        <Screen
          readOnly={readOnly}
          highlightedNodes={highlightedNodes}
          highlightedConnections={highlightedConnections}
          onNodeClick={onNodeClick}
          centerOnNode={centerOnNode}
          {...props}
        />
      </DragContextProvider>
    </ScreenContextProvider>
  );
}

export default NodeContainer;

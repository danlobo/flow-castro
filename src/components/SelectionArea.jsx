import React from "react";

/**
 * Componente para mostrar a área de seleção durante a seleção de múltiplos nós
 */
const SelectionArea = ({ localStartPoint, localEndPoint }) => {
  if (
    localStartPoint.x === localEndPoint.x ||
    localStartPoint.y === localEndPoint.y
  ) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        transform: `translate(${Math.min(localStartPoint.x, localEndPoint.x)}px, ${Math.min(localStartPoint.y, localEndPoint.y)}px)`,
        width: Math.abs(localEndPoint.x - localStartPoint.x),
        height: Math.abs(localEndPoint.y - localStartPoint.y),
        border: "3px dashed black",
        backgroundColor: "rgba(0,0,0,0.1)",
        pointerEvents: "none",
      }}
    />
  );
};

export default SelectionArea;

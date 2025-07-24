import React from "react";
import { useTheme } from "../ThemeProvider";
import css from "./SelectionArea.module.css";

/**
 * Componente para mostrar a área de seleção durante a seleção de múltiplos nós
 */
const SelectionArea = ({ localStartPoint, localEndPoint }) => {
  const { themeName, currentTheme } = useTheme();

  if (
    localStartPoint.x === localEndPoint.x ||
    localStartPoint.y === localEndPoint.y
  ) {
    return null;
  }

  return (
    <div
      className={css.container}
      style={{
        transform: `translate(${Math.min(localStartPoint.x, localEndPoint.x)}px, ${Math.min(localStartPoint.y, localEndPoint.y)}px)`,
        width: Math.abs(localEndPoint.x - localStartPoint.x),
        height: Math.abs(localEndPoint.y - localStartPoint.y),
      }}
    />
  );
};

export default SelectionArea;

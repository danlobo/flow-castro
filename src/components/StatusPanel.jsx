import React from "react";
import css from "../Screen.module.css";

/**
 * Componente para mostrar informações de status como escala e posição
 */
const StatusPanel = ({ scale, position }) => {
  return (
    <div className={[css.panel, css.statusPanel].join(" ")}>
      <div>Scale 12: {scale}</div>
      <div>Position: {JSON.stringify(position)}</div>
    </div>
  );
};

export default StatusPanel;

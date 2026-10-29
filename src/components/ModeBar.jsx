import React from "react";
import css from "../Screen.module.css";

/**
 * Hint shown while the canvas is in a temporary mode - a tapped port waiting
 * for the second tap that completes the connection, or touch selection - with
 * a way out that does not require knowing about Esc.
 */
const ModeBar = ({ message, actionLabel, onAction }) => (
  <div className={css.modeBar} role="status" data-flow-mode-bar="">
    <span>{message}</span>
    <button type="button" onClick={onAction}>
      {actionLabel}
    </button>
  </div>
);

export default ModeBar;

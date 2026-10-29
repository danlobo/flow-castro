import React from "react";
import Icon from "@mdi/react";
import {
  mdiGrid,
  mdiGridOff,
  mdiSelectDrag,
  mdiCursorMove,
  mdiSelectRemove,
  mdiSelect,
} from "@mdi/js";
import Button from "../Button.jsx";
import css from "../Screen.module.css";

/**
 * Componente de barra de ferramentas horizontal para controles de grid e modo de seleção
 */
const ToolbarHorizontal = ({
  snapToGrid,
  handleSnapToGrid,
  viewMode,
  selectionMode,
  onToggleSelectionMode,
  selectionModeLabel,
}) => {
  return (
    <div className={[css.panel, css.controlsPanelHorizontal].join(" ")}>
      <Button className={css.controlButton} onClick={handleSnapToGrid}>
        <Icon path={snapToGrid ? mdiGrid : mdiGridOff} size={0.6} />
      </Button>
      {/* Shows the selection the keyboard modifiers would make, and toggles
          the touch selection mode, where a drag selects instead of panning. */}
      <Button
        disabled={!onToggleSelectionMode}
        className={[
          css.controlButton,
          selectionMode ? css.controlButtonActive : null,
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={onToggleSelectionMode}
        aria-pressed={Boolean(selectionMode)}
        aria-label={selectionModeLabel}
        title={selectionModeLabel}
      >
        {viewMode === "select" && <Icon path={mdiSelect} size={0.6} />}
        {viewMode === "select-add" && <Icon path={mdiSelectDrag} size={0.6} />}
        {viewMode === "select-remove" && (
          <Icon path={mdiSelectRemove} size={0.6} />
        )}
        {viewMode === "move" && <Icon path={mdiCursorMove} size={0.6} />}
      </Button>
    </div>
  );
};

export default ToolbarHorizontal;

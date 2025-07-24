import React from "react";
import Icon from "@mdi/react";
import {
  mdiMagnifyPlus,
  mdiMagnifyMinus,
  mdiSetCenter,
  mdiMagnifyScan,
  mdiLock,
  mdiLockOpenVariant,
} from "@mdi/js";
import Button from "../Button.jsx";
import css from "../Screen.module.css";

/**
 * Componente de barra de ferramentas vertical para controles de zoom e bloqueio
 */
const ToolbarVertical = ({
  zoomIn,
  zoomOut,
  centerView,
  resetView,
  canMove,
  setCanMove,
  position,
  scale,
  setStateAndNotify,
}) => {
  return (
    <div className={[css.panel, css.controlsPanelVertical].join(" ")}>
      <Button className={css.controlButton} onClick={() => zoomIn()}>
        <Icon path={mdiMagnifyPlus} size={0.6} />
      </Button>
      <Button className={css.controlButton} onClick={() => zoomOut()}>
        <Icon path={mdiMagnifyMinus} size={0.6} />
      </Button>
      <Button
        className={css.controlButton}
        onClick={() => {
          centerView();
          setStateAndNotify((prev) => ({
            ...prev,
            position,
            scale,
          }));
        }}
      >
        <Icon path={mdiSetCenter} size={0.6} />
      </Button>
      <Button
        className={css.controlButton}
        onClick={() => {
          resetView();
          setStateAndNotify((prev) => ({
            ...prev,
            position,
            scale: 1,
          }));
        }}
      >
        <Icon path={mdiMagnifyScan} size={0.6} />
      </Button>

      <Button
        className={css.controlButton}
        onClick={() => setCanMove(!canMove)}
      >
        <Icon path={canMove ? mdiLockOpenVariant : mdiLock} size={0.6} />
      </Button>
    </div>
  );
};

export default ToolbarVertical;

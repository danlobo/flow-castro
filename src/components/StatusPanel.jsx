import React, { useEffect, useRef } from "react";
import css from "../Screen.module.css";

/**
 * Componente para mostrar informações de status como escala, posição e fps
 */
const StatusPanel = ({ scale, position }) => {
  const fpsRef = useRef(null);

  /**
   * The reading is written straight into the DOM instead of going through
   * state: this panel lives inside the Screen tree, and a meter that
   * re-rendered on every sample would be measuring the cost of showing itself.
   */
  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let shown = null;
    let handle;

    const tick = (now) => {
      frames += 1;

      const elapsed = now - last;
      if (elapsed >= 500) {
        const fps = Math.round((frames * 1000) / elapsed);

        // Writing the same number back would invalidate styles twice a second
        // for nothing, which shows up in the idle profile.
        if (fps !== shown && fpsRef.current) {
          fpsRef.current.textContent = fps;
          shown = fps;
        }

        frames = 0;
        last = now;
      }

      handle = requestAnimationFrame(tick);
    };

    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, []);

  return (
    <div className={[css.panel, css.statusPanel].join(" ")}>
      <div>Scale: {scale}</div>
      <div>
        Position:{" "}
        {JSON.stringify({
          x: Math.round(position.x),
          y: Math.round(position.y),
        })}
      </div>
      <div>
        FPS: <span ref={fpsRef}>—</span>
      </div>
    </div>
  );
};

export default StatusPanel;

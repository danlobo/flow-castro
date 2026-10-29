import React, { useLayoutEffect, useRef } from "react";
import css from "../Screen.module.css";
import connectorCss from "../ConnectorCurve.module.css";
import nodePortCss from "../NodePort.module.css";

const ZOOM = 2;
const SIZE = 128;
// Gap between the finger and the loupe, so the loupe is not under the hand.
const FINGER_GAP = 48;

/**
 * Magnifier shown while a finger drags a connection close to a port it could
 * land on - the finger covers exactly what it is aiming at.
 *
 * It shows a snapshot of the canvas taken when it opens rather than a live
 * view: nothing but the pointer moves during a connection drag, and a single
 * clone moved with a transform costs nothing per frame. The clone is inert,
 * has no ids and no form-control names, so it cannot be found by queries,
 * receive input or join a radio group of the real canvas.
 *
 * `point` is the finger in client coordinates, `target` the overlay of the
 * port the connection would snap to (or null).
 */
const ConnectionLoupe = ({ containerRef, point, target }) => {
  const lensRef = useRef(null);
  const stageRef = useRef(null);
  const markedRef = useRef(null);
  const visible = Boolean(point);

  useLayoutEffect(() => {
    if (!visible) return;

    const wrapper = containerRef.current?.querySelector(
      ".react-transform-wrapper",
    );
    if (!wrapper || !lensRef.current) return;

    const rect = wrapper.getBoundingClientRect();
    const stage = wrapper.cloneNode(true);
    stage.removeAttribute("id");
    stage.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    stage
      .querySelectorAll("[name]")
      .forEach((el) => el.removeAttribute("name"));
    stage
      .querySelectorAll(`.${connectorCss.pathTmp}`)
      .forEach((el) => el.remove());
    stage
      .querySelectorAll(`.${nodePortCss.snapTarget}`)
      .forEach((el) => el.classList.remove(nodePortCss.snapTarget));
    Object.assign(stage.style, {
      position: "absolute",
      left: "0",
      top: "0",
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      transformOrigin: "0 0",
    });
    stage.dataset.originLeft = rect.left;
    stage.dataset.originTop = rect.top;

    lensRef.current.appendChild(stage);
    stageRef.current = stage;

    return () => {
      stage.remove();
      stageRef.current = null;
      markedRef.current = null;
    };
  }, [visible, containerRef]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const lens = lensRef.current;
    const container = containerRef.current;
    if (!point || !stage || !lens || !container) return;

    const originLeft = Number(stage.dataset.originLeft);
    const originTop = Number(stage.dataset.originTop);
    stage.style.transform = `translate(${SIZE / 2}px, ${SIZE / 2}px) scale(${ZOOM}) translate(${originLeft - point.x}px, ${originTop - point.y}px)`;

    // Above the finger, or below when there is no room above.
    const bounds = container.getBoundingClientRect();
    const x = Math.min(
      Math.max(point.x - bounds.left - SIZE / 2, 8),
      bounds.width - SIZE - 8,
    );
    let y = point.y - bounds.top - FINGER_GAP - SIZE;
    if (y < 8) y = point.y - bounds.top + FINGER_GAP;
    lens.style.transform = `translate(${x}px, ${y}px)`;

    const { nodeId, portName, portDirection } = target?.dataset ?? {};
    const marked = target
      ? stage.querySelector(
          `[data-node-id="${CSS.escape(nodeId)}"][data-port-name="${CSS.escape(portName)}"][data-port-direction="${CSS.escape(portDirection)}"]`,
        )
      : null;
    if (marked !== markedRef.current) {
      markedRef.current?.classList.remove(nodePortCss.snapTarget);
      marked?.classList.add(nodePortCss.snapTarget);
      markedRef.current = marked;
    }
  }, [point, target, containerRef]);

  if (!visible) return null;

  return (
    <div
      ref={lensRef}
      className={css.loupe}
      style={{ width: SIZE, height: SIZE }}
      data-flow-loupe=""
      inert=""
      aria-hidden="true"
    >
      <div className={css.loupeCrosshair} />
    </div>
  );
};

export default ConnectionLoupe;

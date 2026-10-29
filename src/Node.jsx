import React from "react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import NodePort from "./NodePort.jsx";
import { useScreenViewportRef } from "./ScreenContext.jsx";
import css from "./Node.module.css";
import { useTheme } from "./ThemeProvider.jsx";
import { throttle } from "./util/throttle";
import { trackPointerDrag } from "./util/pointerDrag";

const stopPropagation = (event) => event.stopPropagation();

function Node({
  name,
  portTypes,
  nodeType,
  value,
  canMove,
  isSelected,
  onChangePosition,
  onDragStart,
  onDragEnd,
  onConnect,
  containerRef,
  onContextMenu,
  onResize,
  onValueChange,
  debugMode,
  highlight,
  readOnly,
  onClick,
  onTap,
  selectionMode,
}) {
  const { currentTheme } = useTheme();

  const nodeRef = useRef();
  useEffect(() => {
    const currentRef = nodeRef.current;
    const observer = new ResizeObserver((entries) => {
      onResize(value.id, {
        width: entries[0].contentRect.width,
        height: entries[0].contentRect.height,
      });
    });
    observer.observe(currentRef);

    return () => {
      observer.unobserve(currentRef);
    };
  }, []);

  const {
    id: nodeId,
    name: nodeName,
    position: nodePosition,
    values: nodeValues,
  } = value;

  useEffect(() => {
    if (nodeId == null) throw new Error("Node id is required");

    if (name == null) throw new Error("Node name is required");

    if (name !== nodeName) {
      console.warn("Node name mismatch", name, nodeName);
    }
  }, [name, nodeName, nodeId]);

  // Read when the drag happens, so a pan does not re-render every node.
  const viewportRef = useScreenViewportRef();

  const handlePointerDown = useCallback(
    (event) => {
      if (!canMove) return;
      if (event.isPrimary === false) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      // Typing in a field must not drag the node it sits in.
      if (event.target.closest?.("input, textarea, select, [contenteditable]"))
        return;

      event.stopPropagation();

      const { scale: screenScale } = viewportRef.current;
      const positionAt = (dx, dy) => ({
        x: nodePosition.x + dx / screenScale,
        y: nodePosition.y + dy / screenScale,
      });

      const handleMove = throttle(
        (dx, dy) => onChangePosition(nodeId, positionAt(dx, dy)),
        16,
        { leading: true, trailing: false },
      );

      trackPointerDrag(event, {
        onStart: () =>
          onDragStart?.(nodeId, { x: nodePosition.x, y: nodePosition.y }),
        onMove: handleMove,
        onEnd: (dx, dy) => onDragEnd?.(nodeId, positionAt(dx, dy)),
        // A pinch took over: put the node back where it was.
        onCancel: () => onDragEnd?.(nodeId, positionAt(0, 0)),
        onTap: () => onTap?.(nodeId),
      });
    },
    [
      canMove,
      nodeId,
      nodePosition,
      viewportRef,
      onChangePosition,
      onDragStart,
      onDragEnd,
      onTap,
    ],
  );

  /**
   * `onContextMenu` and `onClick` are given to the DOM, which only hands back an
   * event - the node id is added here so Screen can pass the same handler to
   * every node instead of one closure per node.
   */
  const handleContextMenu = useCallback(
    (event) => onContextMenu?.(event, nodeId),
    [onContextMenu, nodeId],
  );

  const handleClick = useCallback(() => onClick?.(nodeId), [onClick, nodeId]);

  const onOutputPortConnected = useCallback(
    ({ source, target }) => {
      onConnect?.({ source, target });
    },
    [onConnect],
  );

  const onInputPortConnected = useCallback(
    ({ source, target }) => {
      onConnect?.({ source: target, target: source });
    },
    [onConnect],
  );

  const nodeInputs = useMemo(() => {
    if (typeof nodeType?.inputs === "function")
      return nodeType.inputs(nodeValues);
    return nodeType?.inputs;
  }, [nodeType, nodeValues]);

  useEffect(() => {
    if (nodeInputs == null) return;
    if (nodeValues == null) return;

    const extraValues = Object.keys(nodeValues).filter(
      (key) => !nodeInputs.some((input) => input.name === key),
    );
    if (extraValues.length > 0) {
      const newValues = Object.keys(nodeValues)
        .filter((key) => !extraValues.includes(key))
        .reduce((acc, key) => {
          acc[key] = nodeValues[key];
          return acc;
        }, {});

      onValueChange?.(nodeId, newValues);
    }
  }, [nodeInputs]);

  const nodeOutputs = useMemo(() => {
    if (typeof nodeType?.outputs === "function") {
      return nodeType.outputs(nodeValues, value.connections?.inputs);
    }
    return nodeType?.outputs;
  }, [nodeType, nodeValues, value.connections?.inputs]);

  return (
    <div
      ref={nodeRef}
      id={`card-${nodeId}`}
      key={`card-${nodeId}`}
      className={[
        css.node,
        isSelected ? css.selected : "",
        canMove ? css.movable : "",
      ].join(" ")}
      style={{
        backgroundColor:
          currentTheme?.nodes?.[nodeType?.type]?.body?.background ??
          currentTheme?.nodes?.common?.body?.background,
        border: highlight
          ? `3px solid ${highlight.color}`
          : (currentTheme?.nodes?.[nodeType?.type]?.body?.border ??
            currentTheme?.nodes?.common?.body?.border),
        boxShadow: highlight ? `0 0 14px 2px ${highlight.color}` : undefined,
        color:
          currentTheme?.nodes?.[nodeType?.type]?.body?.color ??
          currentTheme?.nodes?.common?.body?.color,
        transform: `translate(${nodePosition.x}px, ${nodePosition.y}px)`,
        cursor: canMove ? "grab" : onClick ? "pointer" : null,
      }}
      onPointerDown={handlePointerDown}
      // Pointer events come first; the mouse events browsers emit after them
      // must not reach the canvas, which would start an area selection.
      onMouseDown={canMove ? stopPropagation : undefined}
      onContextMenu={onContextMenu ? handleContextMenu : undefined}
      onClick={onClick ? handleClick : undefined}
    >
      {highlight?.label && (
        <span
          style={{
            position: "absolute",
            top: -10,
            right: 8,
            background: highlight.color,
            color: "#fff",
            fontSize: "0.7rem",
            fontWeight: "bold",
            padding: "1px 6px",
            borderRadius: 8,
            pointerEvents: "none",
            zIndex: 10,
            letterSpacing: "0.02em",
          }}
        >
          {highlight.label}
        </span>
      )}
      <div
        className={css.title}
        style={{
          backgroundColor:
            currentTheme?.nodes?.[nodeType?.type]?.title?.background ??
            currentTheme?.nodes?.common?.title?.background,
          color:
            currentTheme?.nodes?.[nodeType?.type]?.title?.color ??
            currentTheme?.nodes?.common?.title?.color,
        }}
      >
        <h3 style={{ textAlign: "center" }}>{debugMode ? nodeId : name}</h3>
      </div>

      <div className={css.container}>
        <div
          className={[css.portsContainer, css.inputPortsContainer].join(" ")}
        >
          {nodeInputs?.map((input) => {
            const portType = portTypes[input.type];

            const hidePort =
              input.hidePort != null ? input.hidePort : portType.hidePort;

            return (
              <NodePort
                name={input.name}
                value={nodeValues[input.name]}
                onValueChange={(v1) => {
                  onValueChange?.(nodeId, {
                    ...value.values,
                    [input.name]: v1,
                  });
                }}
                nodeId={nodeId}
                key={input.name}
                type={portTypes[input.type]}
                direction="input"
                label={input.label}
                hidePort={Boolean(hidePort)}
                containerRef={containerRef}
                isConnected={value.connections?.inputs?.some(
                  (c) => c.name === input.name,
                )}
                onConnected={onInputPortConnected}
                readOnly={readOnly}
                canMove={canMove}
                options={input.options}
                selecting={selectionMode}
              />
            );
          })}
        </div>
        <div
          className={[css.portsContainer, css.outputPortsContainer].join(" ")}
        >
          {nodeOutputs?.map((output) => {
            return (
              <NodePort
                name={output.name}
                nodeId={nodeId}
                key={output.name}
                type={portTypes[output.type]}
                direction="output"
                label={output.label}
                containerRef={containerRef}
                isConnected={value.connections?.outputs?.some(
                  (c) => c.name === output.name,
                )}
                onConnected={onOutputPortConnected}
                canMove={canMove}
                readOnly={readOnly}
                options={output.options}
                selecting={selectionMode}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default memo(Node);

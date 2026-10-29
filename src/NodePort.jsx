import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDragContext } from "./DragContext.jsx";
import css from "./NodePort.module.css";
import { useTheme } from "./ThemeProvider.jsx";
import {
  findConnectionTarget,
  isCompatiblePort,
  portFromOverlay,
  SNAP_RADIUS,
} from "./util/connectionTarget";
import { trackPointerDrag } from "./util/pointerDrag";

// How close (px) to the connector a touch must start to drag a connection.
const CONNECTOR_GRAB_RADIUS = 36;

function NodePort({
  name,
  type,
  nodeId,
  label,
  hidePort,
  onConnected,
  isConnected,
  direction,
  value,
  onValueChange,
  canMove,
  readOnly,
  options,
  selecting,
}) {
  const { currentTheme } = useTheme();
  const { dragInfo, setDragInfo, pendingConnection, setPendingConnection } =
    useDragContext();

  const [internalValue, setInternalValue] = useState(value);

  const shapeStyles = useMemo(
    () => ({
      circle: css.circle,
      square: css.square,
      diamond: css.diamond,
    }),
    [],
  );

  useEffect(() => {
    if (!name) throw new Error("Port name is required. NodeId: " + nodeId);
  }, [name]);

  useEffect(() => {}, [internalValue]);

  useEffect(() => {
    if (isConnected) {
      onValueChange?.(null);
    }
  }, [isConnected]);

  const containerRef = useRef(null);
  const connectorRef = useRef(null);

  const handleUpdateForm = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      onValueChange?.(internalValue);
    },
    [internalValue],
  );

  const connectorRect = useRef();
  useEffect(() => {
    if (!connectorRef.current) return;
    connectorRect.current = connectorRef.current.getBoundingClientRect();
  }, [connectorRef.current]);

  const containerRect = useRef();
  useEffect(() => {
    if (!containerRef.current) return;
    containerRect.current = containerRef.current.getBoundingClientRect();
  }, [containerRef.current]);

  const connectable = !hidePort && canMove && !readOnly;
  const self = { nodeId, portName: name, portType: type?.type, direction };

  const connectTo = (other) => {
    onConnected?.({
      source: { nodeId, portName: name },
      target: { nodeId: other.nodeId, portName: other.portName },
    });
  };

  const isSamePort = (port) =>
    Boolean(port) &&
    String(port.nodeId) === String(nodeId) &&
    port.portName === name &&
    port.direction === direction;

  // A tap starts a pending connection; a second tap on a compatible port
  // completes it. Tapping the same port again cancels, and tapping another
  // incompatible port makes it the new origin.
  const handleTap = () => {
    if (!pendingConnection || isSamePort(pendingConnection)) {
      setPendingConnection?.(pendingConnection ? null : self);
    } else if (isCompatiblePort(pendingConnection, self)) {
      connectTo(pendingConnection);
      setPendingConnection?.(null);
    } else {
      setPendingConnection?.(self);
    }
  };

  const isNearConnector = (event) => {
    const rect = connectorRef.current?.getBoundingClientRect();
    if (!rect) return true;
    return (
      Math.hypot(
        event.clientX - (rect.left + rect.width / 2),
        event.clientY - (rect.top + rect.height / 2),
      ) <= CONNECTOR_GRAB_RADIUS
    );
  };

  const handlePointerDown = (event) => {
    if (!connectable) return;
    if (event.isPrimary === false) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const pointerType = event.pointerType || "mouse";

    // In touch selection mode the whole node, ports included, is for
    // selecting and moving: the press is left to the node.
    if (selecting && pointerType !== "mouse") return;

    // Port rows span the whole node, so when zoomed in a finger would hardly
    // find anywhere to grab the node by. On touch only a press near the
    // connector drags a connection; elsewhere on the row the press is left to
    // the node to move it, and a tap still starts a connection.
    if (pointerType !== "mouse" && !isNearConnector(event)) {
      trackPointerDrag(event, { onTap: handleTap });
      return;
    }

    event.stopPropagation();

    trackPointerDrag(event, {
      onStart: () => {
        const connectorRect = connectorRef.current.getBoundingClientRect();
        setPendingConnection?.(null);
        setDragInfo({
          type: "connector",
          ...self,
          pointerType,
          startX: connectorRect.left,
          startY: connectorRect.top,
        });
      },
      onEnd: (dx, dy, e) => {
        setDragInfo(null);

        const target = findConnectionTarget({
          root: containerRef.current?.closest("[data-flow-screen]"),
          source: self,
          x: e.clientX,
          y: e.clientY,
          radius: SNAP_RADIUS[pointerType] ?? 0,
          overlayClass: css.portOverlay,
        });

        if (target) connectTo(portFromOverlay(target));
      },
      onTap: handleTap,
      onCancel: () => setDragInfo(null),
    });
  };

  const activeConnection =
    dragInfo?.type === "connector" ? dragInfo : pendingConnection;
  const connectState =
    !connectable || !activeConnection
      ? null
      : isSamePort(activeConnection)
        ? pendingConnection
          ? css.pendingSource
          : css.dragSource
        : isCompatiblePort(activeConnection, self)
          ? css.compatible
          : css.incompatible;

  return (
    <div
      ref={containerRef}
      style={{
        cursor: !hidePort && canMove ? "crosshair" : null,
      }}
      className={[css.port, css[direction], connectState]
        .filter(Boolean)
        .join(" ")}
      onPointerDown={handlePointerDown}
      // Pointer events come first; the mouse events browsers emit after them
      // must not reach the node (which would start moving) or the canvas.
      onMouseDown={connectable ? (e) => e.stopPropagation() : undefined}
    >
      {!hidePort && (
        <div
          className={[css.portOverlay, css[direction]].join(" ")}
          id={`card-${nodeId}-${direction}-${name}-overlay`}
          data-port-name={name}
          data-port-type={type.type}
          data-port-direction={direction}
          data-node-id={nodeId}
        ></div>
      )}

      <div
        className={css.label}
        style={{
          justifyContent: direction === "input" ? "flex-start" : "flex-end",
        }}
      >
        <span>{label}</span>
      </div>
      <div
        className={css.formContainer}
        //onBlur={handleUpdateForm}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
      >
        {(direction === "input" &&
          !isConnected &&
          type.render?.({
            value,
            onChange: onValueChange,
            options,
            readOnly,
          })) ??
          null}
      </div>
      {!hidePort && (
        <div
          id={`card-${nodeId}-${direction}-${name}`}
          ref={connectorRef}
          data-port-connector-name={name}
          data-port-connector-type={type.type}
          data-port-connector-direction={direction}
          data-port-connector-connected={Boolean(isConnected)}
          style={{
            background:
              currentTheme.ports?.[type?.type ?? "default"]?.color ??
              type?.color ??
              currentTheme.ports?.default?.color ??
              currentTheme.colors?.primary,
          }}
          className={[
            css.portConnector,
            css[direction],
            shapeStyles[type?.shape ?? "circle"] ?? null,
          ]
            .filter(Boolean)
            .join(" ")}
        />
      )}
    </div>
  );
}

export default memo(NodePort);

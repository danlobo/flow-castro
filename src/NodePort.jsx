import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDragContext } from "./DragContext.jsx";
import { useScreenContext } from "./ScreenContext.jsx";
import css from "./NodePort.module.css";
import { useTheme } from "./ThemeProvider.jsx";
import { throttle } from "./util/throttle";

const globalToLocal = (globalX, globalY, translate, scale) => {
  const localX = globalX / scale;
  const localY = globalY / scale;
  return { x: localX, y: localY };
};

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
  options,
}) {
  const { currentTheme } = useTheme();
  const { position: screenPosition, scale: screenScale } = useScreenContext();
  const { dragInfo, setDragInfo } = useDragContext();

  const [internalValue, setInternalValue] = useState(value);

  const shapeStyles = useMemo(
    () => ({
      circle: css.circle,
      square: css.square,
      diamond: css.diamond,
    }),
    []
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
    [internalValue]
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

  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 });

  const handleMouseDown = (event) => {
    if (hidePort || !canMove) return;

    //event.preventDefault();
    event.stopPropagation();

    const nodePos = containerRef.current.getBoundingClientRect();
    const localPos = globalToLocal(
      event.pageX - nodePos.left,
      event.pageY - nodePos.top,
      screenPosition,
      screenScale
    );

    const connectorRect = connectorRef.current.getBoundingClientRect();

    const _dragInfo = {
      type: "connector",
      nodeId,
      portName: name,
      portType: type,
      startX: connectorRect.left,
      startY: connectorRect.top,
    };

    setDragInfo(_dragInfo);

    const handleMouseMove = throttle(
      (event) => {
        if (!_dragInfo) return;
        if (_dragInfo.type !== "connector") return;

        const localPos = globalToLocal(
          event.pageX - nodePos.left,
          event.pageY - nodePos.top,
          screenPosition,
          screenScale
        );

        setPointerPos((prevPos) => {
          if (
            Math.abs(prevPos.x - localPos.x) < 1 &&
            Math.abs(prevPos.y - localPos.y) < 1
          ) {
            return prevPos;
          }
          return { x: localPos.x, y: localPos.y };
        });
      },
      16,
      { leading: true, trailing: false }
    );

    const handleMouseUp = (e) => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);

      setDragInfo(null);
      if (!_dragInfo) return;

      const targets = document.elementsFromPoint(
        e.pageX - window.scrollX,
        e.pageY - window.scrollY
      );
      const target = targets.find(
        (t) =>
          t.classList?.contains(css.portOverlay) &&
          t.dataset.portDirection.toString() !== direction.toString() &&
          t.dataset.portType.toString() === type.type?.toString()
      );

      if (target) {
        onConnected?.({
          source: { nodeId, portName: name },
          target: {
            nodeId: target.dataset.nodeId,
            portName: target.dataset.portName,
          },
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      ref={containerRef}
      style={{
        cursor: !hidePort && canMove ? "crosshair" : null,
      }}
      className={[css.port, css[direction]].join(" ")}
      onMouseDown={handleMouseDown}
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
      >
        {(direction === "input" &&
          !isConnected &&
          type.render?.({ value, onChange: onValueChange, options })) ??
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

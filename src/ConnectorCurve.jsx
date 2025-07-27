import React, { useCallback } from "react";
import css from "./ConnectorCurve.module.css";
import { useTheme } from "./ThemeProvider.jsx";
import { useScreenContext } from "./ScreenContext.jsx";

export function ConnectorCurveForward({
  type,
  src,
  dst,
  scale,
  tmp,
  invalid,
  onContextMenu,
  waypoints = [],
  onWaypointContextMenu,
  onUpdateWaypoint,
  onWaypointMouseDown,
  isWaypointSelected,
}) {
  const { currentTheme } = useTheme();
  const { scale: screenScale } = useScreenContext();

  const [hovered, setHovered] = React.useState(false);
  const [hoveredWaypointIndex, setHoveredWaypointIndex] = React.useState(-1);
  const [isDragging, setIsDragging] = React.useState(false);

  if (!src || !dst) {
    return;
  }

  const x1 = {
    x: src.x < dst.x ? 5 : -(dst.x - src.x) + 5,
    y: src.y < dst.y ? 5 : -(dst.y - src.y) + 5,
  };

  const x2 = {
    x: src.x < dst.x ? dst.x - src.x + 5 : 5,
    y: src.y < dst.y ? dst.y - src.y + 5 : 5,
  };

  const PADDING = 50;

  let minX = Math.min(src.x, dst.x);
  let minY = Math.min(src.y, dst.y);
  let maxX = Math.max(src.x, dst.x);
  let maxY = Math.max(src.y, dst.y);

  const transformedWaypoints = waypoints.map((waypoint) => {
    return {
      ...waypoint,
      originalX: waypoint.x,
      originalY: waypoint.y,
      x: waypoint.x - minX,
      y: waypoint.y - minY,
    };
  });

  const b1 = {
    x:
      x2.x > x1.x
        ? Math.abs(x2.x - x1.x) / 2
        : x1.x - x2.x < PADDING * 3
          ? x1.x + (x1.x - x2.x)
          : x1.x + PADDING * 3 + (x1.x - x2.x) / 7,
    y: x1.y,
  };

  const b2 = {
    x:
      x2.x > x1.x
        ? Math.abs(x2.x - x1.x) / 2
        : x1.x - x2.x < PADDING * 3
          ? x2.x + (x2.x - x1.x)
          : x2.x - PADDING * 3 - (x1.x - x2.x) / 7,
    y: x2.y,
  };

  let pathData = `M ${x1.x + PADDING} ${x1.y + PADDING}`;

  if (waypoints.length === 0) {
    pathData += ` C ${b1.x + PADDING} ${b1.y + PADDING}, ${b2.x + PADDING} ${b2.y + PADDING}, ${x2.x + PADDING} ${x2.y + PADDING}`;
  } else {
    const allPoints = [
      { x: x1.x, y: x1.y },
      ...transformedWaypoints,
      { x: x2.x, y: x2.y },
    ];

    for (let i = 0; i < allPoints.length - 1; i++) {
      const current = allPoints[i];
      const next = allPoints[i + 1];

      const ctrlPoint1 = {
        x: current.x + (next.x - current.x) / 2,
        y: current.y,
      };

      const ctrlPoint2 = {
        x: current.x + (next.x - current.x) / 2,
        y: next.y,
      };

      pathData += ` C ${ctrlPoint1.x + PADDING} ${ctrlPoint1.y + PADDING}, ${ctrlPoint2.x + PADDING} ${ctrlPoint2.y + PADDING}, ${next.x + PADDING} ${next.y + PADDING}`;
    }
  }

  return (
    <svg
      style={{
        transform: `translate(${minX - PADDING}px, ${minY - PADDING}px)`,
        width: maxX - minX + PADDING * 2,
        height: maxY - minY + PADDING * 2,
        zIndex: tmp ? 1000 : -1,
        overflow: "visible",
      }}
      className={[css.container, invalid ? css.invalid : null].join(" ")}
    >
      <path
        style={{
          stroke:
            currentTheme.connections?.[type?.type]?.color ??
            type?.color ??
            currentTheme.connections?.default?.color ??
            "#ccc",
          strokeWidth: hovered
            ? Math.max(10, 10 * (scale || 1))
            : Math.max(4, 5 * (scale || 1)),
        }}
        className={[css.path, tmp ? css.pathTmp : null]
          .filter(Boolean)
          .join(" ")}
        d={pathData}
        onContextMenu={onContextMenu}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />

      {/* Desenhar os waypoints */}
      {transformedWaypoints.map((waypoint, index) => {
        const isSelected = isWaypointSelected && isWaypointSelected(index);

        const waypointRadius =
          hoveredWaypointIndex === index ||
          (isDragging && hoveredWaypointIndex === index) ||
          isSelected
            ? Math.max(10, 10 * scale)
            : Math.max(6, 6 * scale);

        return (
          <circle
            key={`waypoint-${index}`}
            cx={waypoint.x + PADDING}
            cy={waypoint.y + PADDING}
            r={waypointRadius || 0}
            stroke={
              currentTheme.connections?.[type?.type]?.color ??
              type?.color ??
              currentTheme.connections?.default?.color ??
              "#ccc"
            }
            fill={
              currentTheme.connections?.[type?.type]?.color ??
              type?.color ??
              currentTheme.connections?.default?.color ??
              "#ccc"
            }
            strokeWidth={
              isSelected ? Math.max(3, 3 * scale) : Math.max(2, 2 * scale)
            }
            style={{
              cursor:
                isDragging && hoveredWaypointIndex === index
                  ? "grabbing"
                  : "grab",
            }}
            onMouseEnter={() => setHoveredWaypointIndex(index)}
            onMouseLeave={() => setHoveredWaypointIndex(-1)}
            onMouseDown={(e) => {
              if (onWaypointMouseDown) {
                onWaypointMouseDown(e, index);
              }

              if (isDragging) return;

              e.preventDefault();
              e.stopPropagation();

              setIsDragging(true);

              const startX = e.clientX;
              const startY = e.clientY;
              const origWaypoint = waypoints[index];

              const moveHandler = (moveEvent) => {
                moveEvent.preventDefault();
                const dx = (moveEvent.clientX - startX) / screenScale;
                const dy = (moveEvent.clientY - startY) / screenScale;

                const newPosition = {
                  x: origWaypoint.x + dx,
                  y: origWaypoint.y + dy,
                };

                onUpdateWaypoint && onUpdateWaypoint(index, newPosition);
              };

              const upHandler = () => {
                window.removeEventListener("mousemove", moveHandler);
                window.removeEventListener("mouseup", upHandler);
                setIsDragging(false);
                setHoveredWaypointIndex(-1);
              };

              window.addEventListener("mousemove", moveHandler);
              window.addEventListener("mouseup", upHandler);
            }}
            onContextMenu={(e) =>
              onWaypointContextMenu && onWaypointContextMenu(e, index)
            }
            className={[css.waypoint, isSelected ? css.selected : null].join(
              " "
            )}
          />
        );
      })}
    </svg>
  );
}

export function ConnectorCurve({
  type,
  src,
  dst,
  scale,
  tmp,
  onContextMenu,
  index,
  n1Box,
  n2Box,
  waypoints = [],
  onWaypointContextMenu,
  onUpdateWaypoint,
  onWaypointMouseDown,
  isWaypointSelected,
}) {
  if (!src || !dst) {
    return null;
  }

  return (
    <ConnectorCurveForward
      type={type}
      src={src}
      dst={dst}
      scale={scale}
      tmp={tmp}
      onContextMenu={onContextMenu}
      waypoints={waypoints}
      onWaypointContextMenu={onWaypointContextMenu}
      onUpdateWaypoint={onUpdateWaypoint}
      onWaypointMouseDown={onWaypointMouseDown}
      isWaypointSelected={isWaypointSelected}
    />
  );
}

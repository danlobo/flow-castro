import React, { memo, useCallback, useMemo } from "react";
import css from "./ConnectorCurve.module.css";
import { useTheme } from "./ThemeProvider.jsx";
import { useScreenViewportRef } from "./ScreenContext.jsx";

const MIN_CONTROL_OFFSET = 40;
const MAX_CONTROL_OFFSET = 150;
const BACKWARD_CURVATURE = 12;

/**
 * How far a control point sits from its port, horizontally.
 *
 * Forward (the target is to the right) it is half the gap, floored so short
 * links still leave the port horizontally instead of at an angle, and capped
 * so long ones don't flatten into a huge S. Backwards (a loop) it grows with
 * the square root of the distance, which keeps the detour compact.
 */
function controlOffset(distance) {
  if (distance >= 0) {
    return Math.min(
      MAX_CONTROL_OFFSET,
      Math.max(MIN_CONTROL_OFFSET, distance / 2),
    );
  }

  return Math.max(
    MIN_CONTROL_OFFSET,
    BACKWARD_CURVATURE * Math.sqrt(-distance),
  );
}

export const ConnectorCurveForward = memo(function ConnectorCurveForward({
  type,
  src,
  dst,
  scale,
  tmp,
  highlight,
  invalid,
  onContextMenu,
  waypoints = [],
  onWaypointContextMenu,
  onUpdateWaypoint,
  onWaypointMouseDown,
  selectedWaypointsKey = "",
}) {
  const { currentTheme } = useTheme();
  const viewportRef = useScreenViewportRef();

  /** Selection arrives as a string so this component can be memoized. */
  const selectedWaypoints = useMemo(
    () =>
      new Set(
        selectedWaypointsKey ? selectedWaypointsKey.split(",").map(Number) : [],
      ),
    [selectedWaypointsKey],
  );

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

  const offset = controlOffset(x2.x - x1.x);

  const b1 = { x: x1.x + offset, y: x1.y };
  const b2 = { x: x2.x - offset, y: x2.y };

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

      if (Math.abs(next.y - current.y) < 1) {
        // A straight run, typically a routing lane. A curve here would only
        // overshoot past both ends along the very same line.
        pathData += ` L ${next.x + PADDING} ${next.y + PADDING}`;
        continue;
      }

      const segmentOffset = controlOffset(next.x - current.x);

      const ctrlPoint1 = { x: current.x + segmentOffset, y: current.y };
      const ctrlPoint2 = { x: next.x - segmentOffset, y: next.y };

      pathData += ` C ${ctrlPoint1.x + PADDING} ${ctrlPoint1.y + PADDING}, ${ctrlPoint2.x + PADDING} ${ctrlPoint2.y + PADDING}, ${next.x + PADDING} ${next.y + PADDING}`;
    }
  }

  const OFFSET_X = 5;
  const OFFSET_Y = 5;

  return (
    <g
      transform={`translate(${minX - PADDING - OFFSET_X}, ${minY - PADDING - OFFSET_Y})`}
      data-connector-group
    >
      <path
        data-connector-type={type?.type}
        style={{
          stroke: highlight
            ? highlight.color
            : (currentTheme.connections?.[type?.type]?.color ??
              type?.color ??
              currentTheme.connections?.default?.color ??
              "#ccc"),
          strokeWidth: highlight
            ? Math.max(8, 10 * (scale || 1))
            : hovered
              ? Math.max(10, 10 * (scale || 1))
              : Math.max(4, 5 * (scale || 1)),
          ...(highlight
            ? { filter: `drop-shadow(0 0 6px ${highlight.color})` }
            : {}),
        }}
        className={[
          css.path,
          tmp ? css.pathTmp : null,
          highlight?.animated ? css.pathAnimated : null, // opcional
        ]
          .filter(Boolean)
          .join(" ")}
        d={pathData}
        onContextMenu={onContextMenu}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />

      {/* Desenhar os waypoints */}
      {transformedWaypoints.map((waypoint, index) => {
        const isSelected = selectedWaypoints.has(index);

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
              const { scale: screenScale } = viewportRef.current;

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
              " ",
            )}
          />
        );
      })}
    </g>
  );
});

export const ConnectorCurve = memo(function ConnectorCurve({
  type,
  src,
  dst,
  scale,
  tmp,
  highlight,
  onContextMenu,
  index,
  n1Box,
  n2Box,
  waypoints = [],
  onWaypointContextMenu,
  onUpdateWaypoint,
  onWaypointMouseDown,
  selectedWaypointsKey,
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
      highlight={highlight}
      onContextMenu={onContextMenu}
      waypoints={waypoints}
      onWaypointContextMenu={onWaypointContextMenu}
      onUpdateWaypoint={onUpdateWaypoint}
      onWaypointMouseDown={onWaypointMouseDown}
      selectedWaypointsKey={selectedWaypointsKey}
    />
  );
});

import React from "react";
import css from "./ConnectorCurve.module.css";
import { useTheme } from "./ThemeProvider";

export function ConnectorCurveForward({
  type,
  src,
  dst,
  scale,
  tmp,
  onContextMenu,
}) {
  const { currentTheme } = useTheme();

  const [hovered, setHovered] = React.useState(false);

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

  return (
    <svg
      style={{
        transform: `translate(${Math.min(src.x, dst.x) - PADDING}px, ${Math.min(src.y, dst.y) - PADDING}px)`,
        width: Math.abs(dst.x - src.x) + PADDING * 2,
        height: Math.abs(dst.y - src.y) + PADDING * 2,
        zIndex: tmp ? 1000 : -1,
      }}
      className={css.container}
    >
      <path
        style={{
          stroke: currentTheme.connections?.[type?.type]?.color ?? "#ccc",
          strokeWidth: hovered
            ? Math.max(10, 10 * scale)
            : Math.max(4, 5 * scale),
        }}
        className={[css.path, tmp ? css.pathTmp : null]
          .filter(Boolean)
          .join(" ")}
        d={`M ${x1.x + PADDING} ${x1.y + PADDING} C ${b1.x + PADDING} ${b1.y + PADDING}, ${b2.x + PADDING} ${b2.y + PADDING}, ${x2.x + PADDING} ${x2.y + PADDING}`}
        onContextMenu={onContextMenu}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
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
}) {
  if (!src || !dst) {
    return;
  }

  return (
    <ConnectorCurveForward
      type={type}
      src={src}
      dst={dst}
      scale={scale}
      tmp={tmp}
      onContextMenu={onContextMenu}
    />
  );
}

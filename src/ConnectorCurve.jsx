import css from './ConnectorCurve.module.css'
import { useTheme } from './ThemeProvider'

export function ConnectorCurveForward({ type, src, dst, scale, tmp, onContextMenu}) {
  const { currentTheme } = useTheme()

  if (!src || !dst) {
    return
  }

  const x1 = {
    x: src.x < dst.x ? 5 : - (dst.x - src.x) + 5,
    y: src.y < dst.y ? 5 : - (dst.y - src.y) + 5,
  }

  const x2 = {
    x: src.x < dst.x ? dst.x - src.x + 5 : 5,
    y: src.y < dst.y ? dst.y - src.y + 5 : 5,
  }

  const b1 = {
    x: Math.abs(x2.x - x1.x) / 2,
    y: x1.y,
  }

  const b2 = {
    x: Math.abs(x2.x - x1.x) / 2,
    y: x2.y,
  }

  return (
    <svg
      style={{
        transform: `translate(${Math.min(src.x, dst.x)}px, ${Math.min(src.y, dst.y)}px)`,
        width: Math.abs(dst.x-src.x)+10,
        height: Math.abs(dst.y-src.y)+10,
        zIndex: tmp ? 1000 : -1
      }}
      className={css.container}
    >
      <path 
        style={{ 
          stroke: currentTheme.connections?.[type?.type]?.color ?? '#ccc',
          strokeWidth: Math.max(4, 5 * scale) 
        }}
        className={[css.path, tmp ? css.pathTmp : null].filter(Boolean).join(' ')}
        d={`M ${x1.x} ${x1.y} C ${b1.x} ${b1.y}, ${b2.x} ${b2.y}, ${x2.x} ${x2.y}`}
        onContextMenu={onContextMenu}
      />
    </svg>
  )
}

export function ConnectorCurveBackward({ type, src, dst, scale, tmp, onContextMenu, position, index, n1Box, n2Box}) {
  const { currentTheme } = useTheme()

  if (!src || !dst) {
    return
  }

  const x1 = {
    x: - (dst.x - src.x) + 5,
    y: - (dst.y - src.y) + 5,
  }

  const x2 = {
    x: 5,
    y: 5,
  }

  const b1 = {
    x: Math.abs(x2.x - x1.x) / 2,
    y: x1.y,
  }

  const b2 = {
    x: Math.abs(x2.x - x1.x) / 2,
    y: x2.y,
  }

  const rect = {
    x: Math.min(n1Box.x, n2Box.x),
    y: Math.min(n1Box.y, n2Box.y),
    width: Math.abs(n2Box.x - n1Box.x) + Math.max(n1Box.w, n2Box.w) / scale,
    height: Math.abs(n2Box.y - n1Box.y) + Math.max(n1Box.h, n2Box.h) / scale
  }

  const offset = 100
  const curve = 20

  const border = 10

  const points = [
    {x: (n1Box.x > n2Box.x || n2Box.y < n1Box.y ? rect.width : src.x - rect.x - border) + offset + (15 - index) * (offset / 15) + 5, y: src.y - rect.y + offset + 5 },
    {x: (n1Box.x > n2Box.x || n2Box.y < n1Box.y ? dst.x - rect.x + border : 0) + 5, y: dst.y - rect.y + offset + 5}
  ]

  const d = `M ${src.x + 10 - rect.x + offset} ${points[0].y}` +    // .
  ` L${points[0].x - curve - border},${points[0].y} Q${points[0].x - border},${points[0].y} ${points[0].x - border},${points[0].y-curve}` +  // __
  ` L${points[0].x - border},${border + curve} Q${points[0].x - border},${border} ${points[0].x - curve - border}, ${border}` +  // |
  ` L${points[1].x + border + curve},${border} Q${points[1].x + border},${border} ${points[1].x + border},${border+curve}` +  // --
  ` L${points[1].x + border},${points[1].y-curve} Q${points[1].x + border},${points[1].y} ${points[1].x + curve + border},${points[1].y}` +  // |
  ` L${dst.x - rect.x + border + offset},${points[1].y}` // --.

  return (
    <svg
      style={{
        transform: `translate(${rect.x-offset}px, ${rect.y-offset}px)`,
        width: rect.width + offset*2,
        height: rect.height + offset*2,
        zIndex: tmp ? 1000 : -1,
      }}
      className={css.container}
    >
      <path 
        style={{ 
          stroke: currentTheme.connections?.[type?.type]?.color ?? '#ccc',
          strokeWidth: Math.max(4, 5 * scale) 
        }}
        className={[css.path, tmp ? css.pathTmp : null].filter(Boolean).join(' ')}
        d={d}
        onContextMenu={onContextMenu}
      />
    </svg>
  )
}

export function ConnectorCurve({ type, src, dst, scale, tmp, onContextMenu, position, index, n1Box, n2Box}) {  
  if (!src || !dst) {
    return
  }

  if (src.x < dst.x) {
    return <ConnectorCurveForward type={type} src={src} dst={dst} scale={scale} tmp={tmp} onContextMenu={onContextMenu} />
  } else {
    return <ConnectorCurveBackward type={type} src={src} dst={dst} scale={scale} tmp={tmp} onContextMenu={onContextMenu} position={position} index={index} n1Box={n1Box} n2Box={n2Box} />
  }
}
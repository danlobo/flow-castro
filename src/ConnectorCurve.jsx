import css from './ConnectorCurve.module.css'
import { useTheme } from './ThemeProvider'

export function ConnectorCurve({ type, src, dst, scale, tmp, onContextMenu}) {  
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
        d={`M ${x1.x} ${x1.y} C ${b1.x} ${b1.y}, ${b2.x} ${b2.y}, ${x2.x} ${x2.y}`}
        onContextMenu={onContextMenu}
      />
    </svg>
  )
}
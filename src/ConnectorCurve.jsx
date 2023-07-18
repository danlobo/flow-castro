export function ConnectorCurve({ src, dst, scale, tmp, onContextMenu}) {
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
        // border: '1px solid red',
        position: 'absolute',
        transform: `translate(${Math.min(src.x, dst.x)}px, ${Math.min(src.y, dst.y)}px)`,
        top: -5,
        left: -5,
        width: Math.abs(dst.x-src.x)+10,
        height: Math.abs(dst.y-src.y)+10,
        zIndex: tmp ? 1000 : -1,
      }}
    >
      {/* <circle cx={x1.x} cy={x1.y} r={12} fill="green" />
      <circle cx={x2.x} cy={x2.y} r={12} fill="red" />
      <circle cx={b1.x} cy={b1.y} r={5} fill="blue" />
      <circle cx={b2.x} cy={b2.y} r={5} fill="purple" /> */}
      <path 
        style={{ position: 'relative', pointerEvents:'all', strokeWidth: Math.max(4, 5 * scale) }}
        className={tmp ? 'tmp-connector' : "connector-curve"}
        d={`M ${x1.x} ${x1.y} C ${b1.x} ${b1.y}, ${b2.x} ${b2.y}, ${x2.x} ${x2.y}`}
        onContextMenu={onContextMenu}
      />
    </svg>
  )
}
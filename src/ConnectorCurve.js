export function ConnectorCurve({ src, dst }) {
  const b1 = {
    x: src.x + (dst.x - src.x) / 2,
    y: src.y,
  }

  const b2 = {
    x: src.x + (dst.x - src.x) / 2,
    y: dst.y,
  }

  return (
    <svg
      style={{
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        zIndex: 1000,
      }}
    >
      <path d={`M ${
        src.x
      } ${
        src.y
      } C ${
        b1.x
      } ${
        b1.y
      }, ${
        b2.x
      } ${
        b2.y
      }, ${
        dst.x
      } ${
        dst.y
      }`} stroke="black" fill="none"/>
    </svg>
  )
}
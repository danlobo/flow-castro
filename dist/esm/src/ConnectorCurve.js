import { jsx } from 'react/jsx-runtime';

function ConnectorCurve(_ref) {
  var {
    src,
    dst,
    scale,
    tmp,
    onContextMenu
  } = _ref;
  if (!src || !dst) {
    return;
  }
  var x1 = {
    x: src.x < dst.x ? 5 : -(dst.x - src.x) + 5,
    y: src.y < dst.y ? 5 : -(dst.y - src.y) + 5
  };
  var x2 = {
    x: src.x < dst.x ? dst.x - src.x + 5 : 5,
    y: src.y < dst.y ? dst.y - src.y + 5 : 5
  };
  var b1 = {
    x: Math.abs(x2.x - x1.x) / 2,
    y: x1.y
  };
  var b2 = {
    x: Math.abs(x2.x - x1.x) / 2,
    y: x2.y
  };
  return /*#__PURE__*/jsx("svg", {
    style: {
      // border: '1px solid red',
      position: 'absolute',
      transform: "translate(".concat(Math.min(src.x, dst.x), "px, ").concat(Math.min(src.y, dst.y), "px)"),
      top: -5,
      left: -5,
      width: Math.abs(dst.x - src.x) + 10,
      height: Math.abs(dst.y - src.y) + 10,
      zIndex: tmp ? 1000 : -1
    },
    children: /*#__PURE__*/jsx("path", {
      style: {
        position: 'relative',
        pointerEvents: 'all',
        strokeWidth: Math.max(4, 5 * scale)
      },
      className: tmp ? 'tmp-connector' : "connector-curve",
      d: "M ".concat(x1.x, " ").concat(x1.y, " C ").concat(b1.x, " ").concat(b1.y, ", ").concat(b2.x, " ").concat(b2.y, ", ").concat(x2.x, " ").concat(x2.y),
      onContextMenu: onContextMenu
    })
  });
}

export { ConnectorCurve };
//# sourceMappingURL=ConnectorCurve.js.map

'use strict';

var ConnectorCurve_module = require('./ConnectorCurve.module.css.js');
var ThemeProvider = require('./ThemeProvider.js');
var jsxRuntime = require('react/jsx-runtime');

function ConnectorCurve(_ref) {
  var _currentTheme$connect, _currentTheme$connect2;
  var {
    type,
    src,
    dst,
    scale,
    tmp,
    onContextMenu
  } = _ref;
  var {
    currentTheme
  } = ThemeProvider.useTheme();
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
  return /*#__PURE__*/jsxRuntime.jsx("svg", {
    style: {
      transform: "translate(".concat(Math.min(src.x, dst.x), "px, ").concat(Math.min(src.y, dst.y), "px)"),
      width: Math.abs(dst.x - src.x) + 10,
      height: Math.abs(dst.y - src.y) + 10,
      zIndex: tmp ? 1000 : -1
    },
    className: ConnectorCurve_module.container,
    children: /*#__PURE__*/jsxRuntime.jsx("path", {
      style: {
        stroke: (_currentTheme$connect = (_currentTheme$connect2 = currentTheme.connections) === null || _currentTheme$connect2 === void 0 || (_currentTheme$connect2 = _currentTheme$connect2[type === null || type === void 0 ? void 0 : type.type]) === null || _currentTheme$connect2 === void 0 ? void 0 : _currentTheme$connect2.color) !== null && _currentTheme$connect !== void 0 ? _currentTheme$connect : '#ccc',
        strokeWidth: Math.max(4, 5 * scale)
      },
      className: [ConnectorCurve_module.path, tmp ? ConnectorCurve_module.pathTmp : null].filter(Boolean).join(' '),
      d: "M ".concat(x1.x, " ").concat(x1.y, " C ").concat(b1.x, " ").concat(b1.y, ", ").concat(b2.x, " ").concat(b2.y, ", ").concat(x2.x, " ").concat(x2.y),
      onContextMenu: onContextMenu
    })
  });
}

exports.ConnectorCurve = ConnectorCurve;
//# sourceMappingURL=ConnectorCurve.js.map

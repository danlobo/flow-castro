'use strict';

var _rollupPluginBabelHelpers = require('../_virtual/_rollupPluginBabelHelpers.js');
var DragContext = require('./DragContext.js');
var ScreenContext = require('./ScreenContext.js');
var Screen = require('./Screen.js');
var jsxRuntime = require('react/jsx-runtime');

var _excluded = ["theme", "themes", "state"];
function NodeContainer(_ref) {
  var {
      theme,
      themes,
      state
    } = _ref,
    props = _rollupPluginBabelHelpers.objectWithoutProperties(_ref, _excluded);
  return /*#__PURE__*/jsxRuntime.jsx(ScreenContext.ScreenContextProvider, {
    initialState: state,
    children: /*#__PURE__*/jsxRuntime.jsx(DragContext.DragContextProvider, {
      children: /*#__PURE__*/jsxRuntime.jsx(Screen, _rollupPluginBabelHelpers.objectSpread2({}, props))
    })
  });
}

module.exports = NodeContainer;
//# sourceMappingURL=NodeContainer.js.map

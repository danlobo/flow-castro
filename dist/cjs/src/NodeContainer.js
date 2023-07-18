'use strict';

var _rollupPluginBabelHelpers = require('../_virtual/_rollupPluginBabelHelpers.js');
var DragContext = require('./DragContext.js');
var ScreenContext = require('./ScreenContext.js');
var Screen = require('./Screen.js');
var jsxRuntime = require('react/jsx-runtime');

function NodeContainer(props) {
  return /*#__PURE__*/jsxRuntime.jsx(ScreenContext.ScreenContextProvider, {
    initialState: props.state,
    children: /*#__PURE__*/jsxRuntime.jsx(DragContext.DragContextProvider, {
      children: /*#__PURE__*/jsxRuntime.jsx(Screen, _rollupPluginBabelHelpers.objectSpread2({}, props))
    })
  });
}

module.exports = NodeContainer;
//# sourceMappingURL=NodeContainer.js.map

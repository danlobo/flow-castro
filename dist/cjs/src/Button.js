'use strict';

var _rollupPluginBabelHelpers = require('../_virtual/_rollupPluginBabelHelpers.js');
var ThemeProvider = require('./ThemeProvider.js');
var jsxRuntime = require('react/jsx-runtime');

var _excluded = ["children"];
var Button = _ref => {
  var {
      children
    } = _ref,
    props = _rollupPluginBabelHelpers.objectWithoutProperties(_ref, _excluded);
  var {
    currentTheme
  } = ThemeProvider.useTheme();
  return /*#__PURE__*/jsxRuntime.jsx("button", _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, props), {}, {
    style: {
      backgroundColor: currentTheme.buttons.default.backgroundColor,
      border: currentTheme.buttons.default.border,
      color: currentTheme.buttons.default.color,
      borderRadius: currentTheme.roundness
    },
    children: children
  }));
};

module.exports = Button;
//# sourceMappingURL=Button.js.map

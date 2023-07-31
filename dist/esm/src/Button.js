import { objectWithoutProperties as _objectWithoutProperties, objectSpread2 as _objectSpread2 } from '../_virtual/_rollupPluginBabelHelpers.js';
import { useTheme } from './ThemeProvider.js';
import { jsx } from 'react/jsx-runtime';

var _excluded = ["children"];
var Button = _ref => {
  var {
      children
    } = _ref,
    props = _objectWithoutProperties(_ref, _excluded);
  var {
    currentTheme
  } = useTheme();
  return /*#__PURE__*/jsx("button", _objectSpread2(_objectSpread2({}, props), {}, {
    style: {
      backgroundColor: currentTheme.buttons.default.backgroundColor,
      border: currentTheme.buttons.default.border,
      color: currentTheme.buttons.default.color,
      borderRadius: currentTheme.roundness
    },
    children: children
  }));
};

export { Button as default };
//# sourceMappingURL=Button.js.map

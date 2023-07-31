import { objectWithoutProperties as _objectWithoutProperties, objectSpread2 as _objectSpread2 } from '../_virtual/_rollupPluginBabelHelpers.js';
import { DragContextProvider } from './DragContext.js';
import { ScreenContextProvider } from './ScreenContext.js';
import Screen from './Screen.js';
import { jsx } from 'react/jsx-runtime';

var _excluded = ["theme", "themes", "state"];
function NodeContainer(_ref) {
  var {
      theme,
      themes,
      state
    } = _ref,
    props = _objectWithoutProperties(_ref, _excluded);
  return /*#__PURE__*/jsx(ScreenContextProvider, {
    initialState: state,
    children: /*#__PURE__*/jsx(DragContextProvider, {
      children: /*#__PURE__*/jsx(Screen, _objectSpread2({}, props))
    })
  });
}

export { NodeContainer as default };
//# sourceMappingURL=NodeContainer.js.map

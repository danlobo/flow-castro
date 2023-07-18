import { objectSpread2 as _objectSpread2 } from '../_virtual/_rollupPluginBabelHelpers.js';
import { DragContextProvider } from './DragContext.js';
import { ScreenContextProvider } from './ScreenContext.js';
import NodeContainer$1 from './Screen.js';
import { jsx } from 'react/jsx-runtime';

function NodeContainer(props) {
  return /*#__PURE__*/jsx(ScreenContextProvider, {
    initialState: props.state,
    children: /*#__PURE__*/jsx(DragContextProvider, {
      children: /*#__PURE__*/jsx(NodeContainer$1, _objectSpread2({}, props))
    })
  });
}

export { NodeContainer as default };
//# sourceMappingURL=NodeContainer.js.map

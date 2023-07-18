'use strict';

var React = require('react');
var jsxRuntime = require('react/jsx-runtime');

var DragContext = /*#__PURE__*/React.createContext(null);
var DragContextProvider = _ref => {
  var {
    children
  } = _ref;
  var [dragInfo, setDragInfo] = React.useState(null);
  return /*#__PURE__*/jsxRuntime.jsx(DragContext.Provider, {
    value: {
      dragInfo,
      setDragInfo
    },
    children: children
  });
};
var useDragContext = () => {
  var {
    dragInfo,
    setDragInfo
  } = React.useContext(DragContext);
  return {
    dragInfo,
    setDragInfo
  };
};

exports.DragContext = DragContext;
exports.DragContextProvider = DragContextProvider;
exports.useDragContext = useDragContext;
//# sourceMappingURL=DragContext.js.map

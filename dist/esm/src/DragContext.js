import { useState, createContext, useContext } from 'react';
import { jsx } from 'react/jsx-runtime';

var DragContext = /*#__PURE__*/createContext(null);
var DragContextProvider = _ref => {
  var {
    children
  } = _ref;
  var [dragInfo, setDragInfo] = useState(null);
  return /*#__PURE__*/jsx(DragContext.Provider, {
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
  } = useContext(DragContext);
  return {
    dragInfo,
    setDragInfo
  };
};

export { DragContext, DragContextProvider, useDragContext };
//# sourceMappingURL=DragContext.js.map

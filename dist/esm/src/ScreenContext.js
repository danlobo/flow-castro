import { useState, createContext, useContext } from 'react';
import { jsx } from 'react/jsx-runtime';

var ScreenContext = /*#__PURE__*/createContext();
var ScreenContextProvider = _ref => {
  var _initialState$scale, _initialState$positio;
  var {
    children,
    initialState,
    store
  } = _ref;
  var [scale, setScale] = useState((_initialState$scale = initialState === null || initialState === void 0 ? void 0 : initialState.scale) !== null && _initialState$scale !== void 0 ? _initialState$scale : 1);
  var [position, setPosition] = useState((_initialState$positio = initialState === null || initialState === void 0 ? void 0 : initialState.position) !== null && _initialState$positio !== void 0 ? _initialState$positio : {
    x: 0,
    y: 0
  });
  return /*#__PURE__*/jsx(ScreenContext.Provider, {
    value: {
      scale,
      setScale,
      position,
      setPosition
    },
    children: children
  });
};
var useScreenContext = () => {
  var {
    scale,
    setScale,
    position,
    setPosition
  } = useContext(ScreenContext);
  return {
    scale,
    setScale,
    position,
    setPosition
  };
};

export { ScreenContext, ScreenContextProvider, useScreenContext };
//# sourceMappingURL=ScreenContext.js.map

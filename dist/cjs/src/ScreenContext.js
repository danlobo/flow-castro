'use strict';

var React = require('react');
var jsxRuntime = require('react/jsx-runtime');

var ScreenContext = /*#__PURE__*/React.createContext();
var ScreenContextProvider = _ref => {
  var _initialState$scale, _initialState$positio;
  var {
    children,
    initialState,
    store
  } = _ref;
  var [scale, setScale] = React.useState((_initialState$scale = initialState === null || initialState === void 0 ? void 0 : initialState.scale) !== null && _initialState$scale !== void 0 ? _initialState$scale : 1);
  var [position, setPosition] = React.useState((_initialState$positio = initialState === null || initialState === void 0 ? void 0 : initialState.position) !== null && _initialState$positio !== void 0 ? _initialState$positio : {
    x: 0,
    y: 0
  });
  return /*#__PURE__*/jsxRuntime.jsx(ScreenContext.Provider, {
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
  } = React.useContext(ScreenContext);
  return {
    scale,
    setScale,
    position,
    setPosition
  };
};

exports.ScreenContext = ScreenContext;
exports.ScreenContextProvider = ScreenContextProvider;
exports.useScreenContext = useScreenContext;
//# sourceMappingURL=ScreenContext.js.map

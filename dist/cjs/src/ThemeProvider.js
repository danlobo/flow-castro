'use strict';

var React = require('react');
var light = require('./theme/light.js');
var dark = require('./theme/dark.js');
var deepMerge = require('./util/deepMerge.js');
var jsxRuntime = require('react/jsx-runtime');

var _themes = {
  light,
  dark
};
var _defaultTheme = {
  themeName: 'light',
  currentTheme: _themes.light,
  setThemeName: v => {
    console.log('setThemeName not initialized');
  }
};
var ThemeContext = /*#__PURE__*/React.createContext(_defaultTheme);
var ThemeProvider = _ref => {
  var {
    children,
    themes,
    initialTheme = 'light'
  } = _ref;
  var [theme, setTheme] = React.useState(null);
  var [themeName, setThemeName] = React.useState(initialTheme);
  React.useEffect(() => {
    setTheme(deepMerge.deepMerge({}, _themes[themeName], themes[themeName], themes.common));
  }, [themeName, themes]);
  if (!theme) return null;
  return /*#__PURE__*/jsxRuntime.jsx(ThemeContext.Provider, {
    value: {
      themeName,
      currentTheme: theme,
      setThemeName
    },
    children: children
  });
};
var useTheme = () => React.useContext(ThemeContext);

exports.ThemeProvider = ThemeProvider;
exports.useTheme = useTheme;
//# sourceMappingURL=ThemeProvider.js.map

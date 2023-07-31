import React, { useState, useEffect } from 'react';
import light from './theme/light.js';
import dark from './theme/dark.js';
import { deepMerge } from './util/deepMerge.js';
import { jsx } from 'react/jsx-runtime';

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
  var [theme, setTheme] = useState(null);
  var [themeName, setThemeName] = useState(initialTheme);
  useEffect(() => {
    setTheme(deepMerge({}, _themes[themeName], themes[themeName], themes.common));
  }, [themeName, themes]);
  if (!theme) return null;
  return /*#__PURE__*/jsx(ThemeContext.Provider, {
    value: {
      themeName,
      currentTheme: theme,
      setThemeName
    },
    children: children
  });
};
var useTheme = () => React.useContext(ThemeContext);

export { ThemeProvider, useTheme };
//# sourceMappingURL=ThemeProvider.js.map

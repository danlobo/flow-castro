import React, { useEffect, useMemo, useState } from 'react';
import light from "./theme/light";
import dark from "./theme/dark";
import { deepMerge } from './util/deepMerge';

const _themes = {
  light,
  dark
};

const _defaultTheme = {
  themeName: 'light',
  currentTheme: _themes.light,
  setThemeName: (v) => {
    console.log('setThemeName not initialized')
  }
}

const ThemeContext = React.createContext(_defaultTheme);

export const ThemeProvider = ({ children, themes, initialTheme = 'light' }) => {
  const [theme, setTheme] = useState(null);
  const [themeName, setThemeName] = useState(initialTheme);

  useEffect(() => {
    setTheme(deepMerge({}, _themes[themeName], themes[themeName], themes.common));
  }, [themeName, themes])


  if (!theme) return null

  return (
    <ThemeContext.Provider value={{ 
      themeName, 
      currentTheme: theme,
      setThemeName
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => React.useContext(ThemeContext);
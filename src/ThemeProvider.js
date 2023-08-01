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

export const ThemeProvider = ({ children, themes, theme = 'light' }) => {
  const [currentTheme, setCurrentTheme] = useState(null);
  const [themeName, setThemeName] = useState(theme);

  useEffect(() => {
    setCurrentTheme(deepMerge({}, _themes[themeName], themes[themeName], themes.common));
  }, [themeName, themes])

  useEffect(() => {
    setThemeName(theme)
  }, [theme])

  if (!currentTheme) return null

  return (
    <ThemeContext.Provider value={{ 
      themeName, 
      currentTheme,
      setThemeName
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => React.useContext(ThemeContext);
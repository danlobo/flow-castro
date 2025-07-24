import React from "react";
import { useTheme } from "./ThemeProvider.jsx";

const Button = ({ children, ...props }) => {
  const { currentTheme } = useTheme();
  return (
    <button
      {...props}
      style={{
        backgroundColor: currentTheme.buttons?.default?.backgroundColor,
        border: currentTheme.buttons?.default?.border,
        color: currentTheme.buttons?.default?.color,
        borderRadius: currentTheme.roundness,
      }}
    >
      {children}
    </button>
  );
};

export default Button;

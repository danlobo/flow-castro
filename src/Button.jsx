import { useTheme } from "./ThemeProvider"

const Button = ({ children, ...props }) => {
  const { currentTheme } = useTheme()
    return (
        <button {...props} style={{
          backgroundColor: currentTheme.buttons.default.backgroundColor,
          border: currentTheme.buttons.default.border,
          color: currentTheme.buttons.default.color,
          borderRadius: currentTheme.roundness,
        }}>{children}</button>
    )
}

export default Button
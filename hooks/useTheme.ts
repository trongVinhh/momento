import { useThemeContext } from '../context/ThemeContext'

export function useTheme() {
  const { theme, colors, toggleTheme, setManualTheme } = useThemeContext()
  const isDark = theme === 'dark'
  
  return {
    theme,
    colors,
    toggleTheme,
    setManualTheme,
    isDark,
  }
}

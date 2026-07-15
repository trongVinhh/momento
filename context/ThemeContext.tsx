import React, { createContext, useState, useEffect, useContext } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LIGHT_COLORS, DARK_COLORS } from '../constants/theme'

export type ThemeType = 'light' | 'dark'

export type ThemeColors = {
  [K in keyof typeof LIGHT_COLORS]: K extends 'blurTint' ? 'light' | 'dark' : string
}

interface ThemeContextData {
  theme: ThemeType
  colors: ThemeColors
  toggleTheme: () => void
  setManualTheme: (theme: ThemeType) => void
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme()
  const [theme, setTheme] = useState<ThemeType>('dark') // Mặc định ban đầu là tối

  useEffect(() => {
    // 1. Tải theme thủ công đã lưu từ bộ nhớ (nếu có)
    const loadSavedTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem('@user_theme')
        if (saved === 'light' || saved === 'dark') {
          setTheme(saved)
        } else if (systemScheme) {
          // Nếu không lưu, lấy theo hệ thống
          setTheme(systemScheme)
        }
      } catch (err) {
        console.warn('Không thể tải theme lưu trữ:', err)
      }
    }
    loadSavedTheme()
  }, [systemScheme])

  const toggleTheme = async () => {
    const nextTheme: ThemeType = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    try {
      await AsyncStorage.setItem('@user_theme', nextTheme)
    } catch (err) {
      console.warn('Không thể lưu theme:', err)
    }
  }

  const setManualTheme = async (selected: ThemeType) => {
    setTheme(selected)
    try {
      await AsyncStorage.setItem('@user_theme', selected)
    } catch (err) {
      console.warn('Không thể lưu theme:', err)
    }
  }

  const colors = theme === 'light' ? LIGHT_COLORS : DARK_COLORS

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setManualTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useThemeContext = () => useContext(ThemeContext)

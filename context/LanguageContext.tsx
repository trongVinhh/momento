import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { en } from '../locales/en'
import { vi } from '../locales/vi'

type Locale = 'en' | 'vi'

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, replacements?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations: Record<Locale, Record<string, string>> = { en, vi }

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('vi') // Mặc định là tiếng Việt

  useEffect(() => {
    const loadLocale = async () => {
      try {
        const saved = await AsyncStorage.getItem('@user_locale')
        if (saved === 'en' || saved === 'vi') {
          setLocaleState(saved)
        }
      } catch (e) {
        console.log('Failed to load locale:', e)
      }
    }
    loadLocale()
  }, [])

  const setLocale = async (newLocale: Locale) => {
    setLocaleState(newLocale)
    try {
      await AsyncStorage.setItem('@user_locale', newLocale)
    } catch (e) {
      console.log('Failed to save locale:', e)
    }
  }

  const t = (key: string, replacements?: Record<string, string | number>) => {
    const localeDict = translations[locale] || translations['vi']
    const translation = localeDict[key] || translations['en'][key] || key
    
    if (!replacements) return translation

    let result = translation
    Object.entries(replacements).forEach(([k, v]) => {
      result = result.replace(`{{${k}}}`, String(v))
    })
    return result
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}

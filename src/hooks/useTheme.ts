import { useCallback, useEffect, useState } from 'react'
import { chromeStorage } from '../utils/chrome-apis'
import { STORAGE_KEYS } from '../utils/constants'

export type ThemeId = 'dark' | 'light' | 'ocean' | 'sunset' | 'forest' | 'purple' | 'rose' | 'midnight'

export interface ThemeSettings {
  id: ThemeId
  name: string
  surface: string
  text: string
  textSecondary: string
  border: string
  accent: string
  backgroundGradient?: string
}

export interface UserThemePreferences {
  themeId: ThemeId
}

const BUILT_IN_THEMES: Record<ThemeId, ThemeSettings> = {
  dark: {
    id: 'dark',
    name: 'Dark',
    surface: '#1e293b',
    text: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.7)',
    border: '#374151',
    accent: '#3b82f6',
    backgroundGradient: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
  },
  light: {
    id: 'light',
    name: 'Georgia Tech Gold',
    surface: '#f7f3e9',
    text: '#003057',
    textSecondary: '#54585a',
    border: '#b3a369',
    accent: '#003057',
    backgroundGradient: 'linear-gradient(135deg, #f7f3e9 0%, #eaab00 50%, #b3a369 100%)'
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean Blue',
    surface: '#0f172a',
    text: '#e2e8f0',
    textSecondary: 'rgba(226,232,240,0.75)',
    border: 'rgba(226,232,240,0.2)',
    accent: '#38bdf8',
    backgroundGradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0f172a 100%)'
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Orange',
    surface: '#1f2937',
    text: '#fff7ed',
    textSecondary: 'rgba(255,247,237,0.8)',
    border: 'rgba(255,247,237,0.2)',
    accent: '#f97316',
    backgroundGradient: 'linear-gradient(135deg, #fb923c 0%, #ef4444 50%, #1f2937 100%)'
  },
  forest: {
    id: 'forest',
    name: 'Forest Green',
    surface: '#1a2e1a',
    text: '#e8f5e8',
    textSecondary: 'rgba(232,245,232,0.8)',
    border: 'rgba(232,245,232,0.2)',
    accent: '#22c55e',
    backgroundGradient: 'linear-gradient(135deg, #166534 0%, #15803d 50%, #1a2e1a 100%)'
  },
  purple: {
    id: 'purple',
    name: 'Royal Purple',
    surface: '#2e1a2e',
    text: '#f3e8ff',
    textSecondary: 'rgba(243,232,255,0.8)',
    border: 'rgba(243,232,255,0.2)',
    accent: '#a855f7',
    backgroundGradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #2e1a2e 100%)'
  },
  rose: {
    id: 'rose',
    name: 'Rose Gold',
    surface: '#2d1b1b',
    text: '#fdf2f8',
    textSecondary: 'rgba(253,242,248,0.8)',
    border: 'rgba(253,242,248,0.2)',
    accent: '#f43f5e',
    backgroundGradient: 'linear-gradient(135deg, #e11d48 0%, #be185d 50%, #2d1b1b 100%)'
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Blue',
    surface: '#0c1426',
    text: '#e1e7ef',
    textSecondary: 'rgba(225,231,239,0.8)',
    border: 'rgba(225,231,239,0.2)',
    accent: '#60a5fa',
    backgroundGradient: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #0c1426 100%)'
  }
}

const DEFAULT_PREFERENCES: UserThemePreferences = {
  themeId: 'dark'
}

const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result 
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '59, 130, 246' // fallback
}

const applyCssVars = (theme: ThemeSettings) => {
  const root = document.documentElement
  root.style.setProperty('--theme-surface', theme.surface)
  root.style.setProperty('--theme-text', theme.text)
  root.style.setProperty('--theme-text-secondary', theme.textSecondary)
  root.style.setProperty('--theme-border', theme.border)
  root.style.setProperty('--theme-accent', theme.accent)
  root.style.setProperty('--theme-accent-rgb', hexToRgb(theme.accent))
  if (theme.backgroundGradient) {
    root.style.setProperty('--theme-background-gradient', theme.backgroundGradient)
  }
}

export const useTheme = () => {
  const [preferences, setPreferences] = useState<UserThemePreferences>(DEFAULT_PREFERENCES)
  const [currentTheme, setCurrentTheme] = useState<ThemeSettings>(BUILT_IN_THEMES[DEFAULT_PREFERENCES.themeId])
  const [isThemeLoaded, setIsThemeLoaded] = useState(false)

  // Apply default theme immediately on first render (but this will be overridden by stored theme)
  useEffect(() => {
    applyCssVars(BUILT_IN_THEMES.dark)
  }, [])

  useEffect(() => {
    
    const loadTheme = async () => {
      try {
        const stored = await chromeStorage.get<UserThemePreferences>(STORAGE_KEYS.THEME_PREFERENCES)
        
        let prefs: UserThemePreferences
        
        if (stored && stored.themeId && BUILT_IN_THEMES[stored.themeId]) {
          // Use stored preferences if valid
          prefs = stored
        } else {
          // Fall back to default
          prefs = DEFAULT_PREFERENCES
        }
        
        
        const selected = BUILT_IN_THEMES[prefs.themeId]
        
        // Update state
        setPreferences(prefs)
        setCurrentTheme(selected)
        setIsThemeLoaded(true)
        
        // Apply CSS variables immediately and force a repaint
        applyCssVars(selected)
        // Force a style recalculation
        document.documentElement.offsetHeight
        
        
        // Verify CSS variables were actually set
        const computedStyle = getComputedStyle(document.documentElement)
        
      } catch (error) {
        const defaultTheme = BUILT_IN_THEMES.dark
        setCurrentTheme(defaultTheme)
        setPreferences(DEFAULT_PREFERENCES)
        applyCssVars(defaultTheme)
        setIsThemeLoaded(true)
      }
    }
    
    loadTheme()
  }, [])

  // Also apply CSS variables whenever currentTheme changes
  useEffect(() => {
    applyCssVars(currentTheme)
  }, [currentTheme])

  const setThemeId = useCallback(async (themeId: ThemeId) => {
    
    const nextPrefs: UserThemePreferences = { ...preferences, themeId }
    
    const selected = BUILT_IN_THEMES[themeId]
    if (!selected) {
      return
    }
    
    
    // Update state first
    setPreferences(nextPrefs)
    setCurrentTheme(selected)
    applyCssVars(selected)
    
    
    try {
      const success = await chromeStorage.set(STORAGE_KEYS.THEME_PREFERENCES, nextPrefs)
      if (success) {
        
        // Verify what was actually saved
        const verification = await chromeStorage.get(STORAGE_KEYS.THEME_PREFERENCES)
      } else {
      }
    } catch (error) {
    }
    
  }, [preferences])


  // Debug function to manually check storage
  const debugStorage = useCallback(async () => {
    try {
      const result = await chromeStorage.get(STORAGE_KEYS.THEME_PREFERENCES)
      return result
    } catch (error) {
      return null
    }
  }, [])

  return {
    theme: currentTheme,
    preferences,
    themes: BUILT_IN_THEMES,
    setThemeId,
    debugStorage,
    isThemeLoaded
  }
}

export default useTheme



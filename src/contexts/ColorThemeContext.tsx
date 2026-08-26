import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeName = 'emerald' | 'blue' | 'purple' | 'rose' | 'amber' | 'teal'

export const THEMES: { id: ThemeName; name: string; colors: string[] }[] = [
  { id: 'emerald', name: 'সবুজ', colors: ['#059669', '#d4af37'] },
  { id: 'blue', name: 'নীল', colors: ['#2563eb', '#06b6d4'] },
  { id: 'purple', name: 'বেগুনি', colors: ['#7c3aed', '#ec4899'] },
  { id: 'rose', name: 'গোলাপি', colors: ['#e11d48', '#f59e0b'] },
  { id: 'amber', name: 'সোনালি', colors: ['#d97706', '#eab308'] },
  { id: 'teal', name: 'টিল', colors: ['#0d9488', '#84cc16'] },
]

interface ColorThemeContextValue {
  activeTheme: ThemeName
  setColorTheme: (theme: ThemeName) => void
}

const ColorThemeContext = createContext<ColorThemeContextValue | null>(null)

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeTheme, setActiveTheme] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('hamid-color-theme') as ThemeName | null
    return saved || 'emerald'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme)
    localStorage.setItem('hamid-color-theme', activeTheme)
  }, [activeTheme])

  return (
    <ColorThemeContext.Provider value={{ activeTheme, setColorTheme: setActiveTheme }}>
      {children}
    </ColorThemeContext.Provider>
  )
}

export function useColorTheme() {
  const ctx = useContext(ColorThemeContext)
  if (!ctx) throw new Error('useColorTheme must be used within ColorThemeProvider')
  return ctx
}

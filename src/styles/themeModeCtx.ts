import { createContext } from 'react'

export type ThemeMode = 'dark' | 'light'

export interface ThemeModeContextValue {
  readonly mode: ThemeMode
  readonly toggle: () => void
}

export const ThemeModeContext = createContext<ThemeModeContextValue | null>(null)

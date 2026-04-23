'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import { darkTheme, lightTheme } from '@/styles/theme'

type Mode = 'dark' | 'light'

interface ThemeModeContextValue {
  readonly mode: Mode
  readonly toggle: () => void
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null)

const STORAGE_KEY = 'tm.mode'
const DEFAULT_MODE: Mode = 'dark'

interface ProviderProps {
  readonly children: ReactNode
}

export function ThemeModeProvider({ children }: ProviderProps): JSX.Element {
  const [mode, setMode] = useState<Mode>(DEFAULT_MODE)

  // Read persisted preference on mount (client-only, avoids hydration mismatch).
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') {
      setMode(stored)
    }
  }, [])

  const value = useMemo<ThemeModeContextValue>(
    () => ({
      mode,
      toggle: () => {
        setMode((prev) => {
          const next: Mode = prev === 'dark' ? 'light' : 'dark'
          window.localStorage.setItem(STORAGE_KEY, next)
          return next
        })
      },
    }),
    [mode],
  )

  const activeTheme = mode === 'dark' ? darkTheme : lightTheme

  return (
    <AppRouterCacheProvider options={{ key: 'mui' }}>
      <ThemeModeContext.Provider value={value}>
        <ThemeProvider theme={activeTheme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </ThemeModeContext.Provider>
    </AppRouterCacheProvider>
  )
}

export function useThemeMode(): ThemeModeContextValue {
  const ctx = useContext(ThemeModeContext)
  if (!ctx) {
    throw new Error('useThemeMode must be used within ThemeModeProvider')
  }
  return ctx
}

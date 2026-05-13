'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import { darkTheme, lightTheme } from '@/styles/theme'
import {
  ThemeModeContext,
  type ThemeMode,
  type ThemeModeContextValue,
} from '@/styles/themeModeCtx'

const STORAGE_KEY = 'tm.mode'
const DEFAULT_MODE: ThemeMode = 'light'

interface Props {
  readonly children: ReactNode
}

export function ThemeModeProvider({ children }: Props): JSX.Element {
  const [mode, setMode] = useState<ThemeMode>(DEFAULT_MODE)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') {
      setMode(stored)
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode)
  }, [mode])

  const value = useMemo<ThemeModeContextValue>(
    () => ({
      mode,
      toggle: () => {
        setMode((prev) => {
          const next: ThemeMode = prev === 'dark' ? 'light' : 'dark'
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

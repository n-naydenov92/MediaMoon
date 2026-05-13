'use client'

import Box from '@mui/material/Box'
import { useThemeMode } from '@/styles/useThemeMode'
import AuthBrandPanel from './AuthBrandPanel/AuthBrandPanel'
import AuthForm from './AuthForm/AuthForm'
import AuthThemeToggle from './AuthThemeToggle/AuthThemeToggle'
import type { AuthMode } from './useGoogleAuth'
import styles from './AuthPage.module.css'

interface AuthPageProps {
  readonly mode: AuthMode
}

export default function AuthPage({ mode }: AuthPageProps): JSX.Element {
  const { mode: themeMode } = useThemeMode()

  return (
    <Box component="main" className={styles.root} data-theme={themeMode}>
      <AuthBrandPanel />
      <AuthForm mode={mode} />
      <AuthThemeToggle />
    </Box>
  )
}

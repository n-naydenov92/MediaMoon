'use client'

import { useThemeMode } from '@/styles/ThemeModeProvider'
import AuthBrandPanel from './AuthBrandPanel'
import AuthForm from './AuthForm'
import AuthThemeToggle from './AuthThemeToggle'
import type { AuthMode } from './useGoogleAuth'
import styles from './AuthPage.module.css'

interface AuthPageProps {
  readonly mode: AuthMode
}

export default function AuthPage({ mode }: AuthPageProps): JSX.Element {
  const { mode: themeMode } = useThemeMode()

  return (
    <main className={styles.root} data-theme={themeMode}>
      <AuthBrandPanel />
      <AuthForm mode={mode} />
      <AuthThemeToggle />
    </main>
  )
}

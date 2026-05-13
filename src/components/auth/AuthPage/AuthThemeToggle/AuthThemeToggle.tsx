'use client'

import Box from '@mui/material/Box'
import { useThemeMode } from '@/styles/useThemeMode'
import { LABELS } from '@/components/layout/labels'
import { MoonIcon, SunIcon } from '../icons'
import styles from './AuthThemeToggle.module.css'

export default function AuthThemeToggle(): JSX.Element {
  const { mode, toggle } = useThemeMode()
  const isDark = mode === 'dark'
  const ariaLabel = isDark ? LABELS.themeToggle.toLightTheme : LABELS.themeToggle.toDarkTheme

  return (
    <Box
      component="button"
      type="button"
      className={styles.toggle}
      aria-label={ariaLabel}
      onClick={toggle}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </Box>
  )
}

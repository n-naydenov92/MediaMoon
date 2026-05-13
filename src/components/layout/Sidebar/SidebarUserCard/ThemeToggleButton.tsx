'use client'

import { memo } from 'react'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { LABELS } from '@/components/layout/labels'
import { useThemeMode } from '@/styles/useThemeMode'
import styles from './ThemeToggleButton.module.css'

const ThemeToggleButton = memo(function ThemeToggleButton(): JSX.Element {
  const { mode, toggle } = useThemeMode()
  const isDark = mode === 'dark'
  const label = isDark
    ? LABELS.themeToggle.toLightTheme
    : LABELS.themeToggle.toDarkTheme

  return (
    <button
      type="button"
      className={styles.root}
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      {isDark ? (
        <LightModeIcon fontSize="small" />
      ) : (
        <DarkModeIcon fontSize="small" />
      )}
    </button>
  )
})

export default ThemeToggleButton

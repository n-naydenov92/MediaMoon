'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import { useThemeMode } from '@/styles/useThemeMode'
import { LABELS } from '@/components/layout/labels'
import MoonIcon from '../icons/MoonIcon'
import SunIcon from '../icons/SunIcon'
import styles from './AuthThemeToggle.module.css'

export default memo(function AuthThemeToggle(): JSX.Element {
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
})

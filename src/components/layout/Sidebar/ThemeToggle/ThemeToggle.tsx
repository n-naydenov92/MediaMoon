'use client'

import { memo } from 'react'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { useThemeMode } from '@/styles/ThemeModeProvider'
import { LABELS } from '@/components/layout/labels'

/**
 * Icon button that toggles between light and dark theme modes.
 */
export default memo(function ThemeToggle(): JSX.Element {
  const { mode, toggle } = useThemeMode()
  const label = mode === 'dark' ? LABELS.themeToggle.toLightTheme : LABELS.themeToggle.toDarkTheme
  return (
    <Tooltip title={label} placement="right">
      <IconButton onClick={toggle} size="small" aria-label={label} sx={{ alignSelf: 'flex-start' }}>
        {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  )
})

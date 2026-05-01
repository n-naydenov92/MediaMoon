'use client'

import { memo } from 'react'
import AppBar from '@mui/material/AppBar'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import ModuleIcon from '@/components/layout/ModuleIcon/ModuleIcon'
import styles from './Topbar.module.css'

interface Props {
  readonly title: string
  readonly iconName?: string
  readonly iconColor?: string
  readonly subtitle?: string | null
}

export default memo(function Topbar({
  title,
  iconName,
  iconColor,
  subtitle,
}: Props): JSX.Element {
  return (
    <AppBar position="sticky" className={styles.bar}>
      <Toolbar sx={{ minHeight: '56px !important', px: { xs: 4, md: 6 } }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1 }}>
          {iconName && <ModuleIcon name={iconName} size={20} color={iconColor} />}
          <Typography variant="h2" sx={{ fontSize: 18 }}>
            {title}
          </Typography>
          {subtitle && (
            <>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                ·
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {subtitle}
              </Typography>
            </>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  )
})

'use client'

import { memo } from 'react'
import AppBar from '@mui/material/AppBar'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import ModuleIcon from '@/components/layout/ModuleIcon/ModuleIcon'
import styles from './Topbar.module.css'

const ICON_SIZE = 20

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
      <Toolbar className={styles.toolbar}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          className={styles.titleRow}
        >
          {iconName && <ModuleIcon name={iconName} size={ICON_SIZE} color={iconColor} />}
          <Typography variant="h2" className={styles.title}>
            {title}
          </Typography>
          {subtitle && (
            <>
              <Typography variant="caption" className={styles.dot}>
                ·
              </Typography>
              <Typography variant="caption" className={styles.subtitle}>
                {subtitle}
              </Typography>
            </>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  )
})

'use client'

import { memo } from 'react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import RefreshIcon from '@mui/icons-material/Refresh'
import { LABELS } from '@/components/layout/labels'
import CacheStatus from '@/components/layout/Topbar/CacheStatus/CacheStatus'
import styles from './Topbar.module.css'

interface Props {
  readonly title: string
  readonly cacheExpiresAt?: string | null
  readonly onRefresh?: () => void
  readonly refreshing?: boolean
}

/**
 * Sticky top application bar showing the current module title, cache status,
 * and an optional manual refresh button with spinning animation while refreshing.
 */
export default memo(function Topbar({
  title,
  cacheExpiresAt,
  onRefresh,
  refreshing = false,
}: Props): JSX.Element {
  return (
    <AppBar position="sticky" className={styles.bar}>
      <Toolbar sx={{ minHeight: '56px !important', px: { xs: 4, md: 6 } }}>
        <Typography variant="h2" sx={{ fontSize: 18 }}>
          {title}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" alignItems="center" spacing={4}>
          <CacheStatus cacheExpiresAt={cacheExpiresAt} />
          {onRefresh && (
            <Tooltip title={LABELS.topbar.refreshData}>
              <span>
                <IconButton
                  onClick={onRefresh}
                  disabled={refreshing}
                  aria-label={LABELS.topbar.refreshData}
                  size="small"
                >
                  <RefreshIcon
                    fontSize="small"
                    sx={{
                      animation: refreshing ? 'spin 800ms linear infinite' : 'none',
                      '@keyframes spin': { to: { transform: 'rotate(360deg)' } },
                    }}
                  />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  )
})

'use client'

import { useEffect, useState } from 'react'
import RefreshIcon from '@mui/icons-material/Refresh'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { formatAgo, formatTimestamp } from '@/lib/relativeTime'
import { useThemeMode } from '@/styles/useThemeMode'
import styles from './UpdatedBadge.module.css'

const TICK_INTERVAL_MS = 30_000

interface Props {
  readonly fetchedAt: number | null
  readonly onRefresh: () => void
  readonly disabled?: boolean
}

export default function UpdatedBadge({ fetchedAt, onRefresh, disabled = false }: Props): JSX.Element {
  const { mode } = useThemeMode()
  const [now, setNow] = useState<number>(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), TICK_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [])

  const ago = fetchedAt === null ? 'Loading…' : formatAgo(now - fetchedAt)
  const labelTooltip = fetchedAt === null ? '' : `Last fetched at ${formatTimestamp(fetchedAt)}`
  const isDisabled = disabled || fetchedAt === null

  return (
    <Box className={styles.root} data-theme={mode}>
      <Tooltip title={labelTooltip} arrow disableInteractive>
        <Typography component="span" variant="caption" className={styles.text}>
          {fetchedAt !== null && (
            <Box component="span" className={styles.prefix}>
              Updated{' '}
            </Box>
          )}
          {ago}
        </Typography>
      </Tooltip>
      <Tooltip title="Refresh data" arrow disableInteractive>
        <Box component="span">
          <IconButton
            className={styles.refresh}
            onClick={onRefresh}
            disabled={isDisabled}
            data-spinning={disabled ? 'true' : undefined}
            aria-label="Refresh data"
            disableRipple
            size="small"
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>
      </Tooltip>
    </Box>
  )
}

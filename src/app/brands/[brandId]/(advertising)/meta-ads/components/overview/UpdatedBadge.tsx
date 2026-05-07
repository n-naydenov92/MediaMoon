'use client'

import { useEffect, useState } from 'react'
import RefreshIcon from '@mui/icons-material/Refresh'
import Tooltip from '@mui/material/Tooltip'
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

  return (
    <div className={styles.root} data-theme={mode}>
      <Tooltip title={labelTooltip} arrow disableInteractive>
        <span className={styles.text}>
          {fetchedAt !== null && <span className={styles.prefix}>Updated </span>}
          {ago}
        </span>
      </Tooltip>
      <Tooltip title="Refresh data" arrow disableInteractive>
        <span>
          <button
            type="button"
            className={styles.refresh}
            onClick={onRefresh}
            disabled={disabled || fetchedAt === null}
            data-spinning={disabled ? 'true' : undefined}
            aria-label="Refresh data"
          >
            <RefreshIcon fontSize="small" />
          </button>
        </span>
      </Tooltip>
    </div>
  )
}

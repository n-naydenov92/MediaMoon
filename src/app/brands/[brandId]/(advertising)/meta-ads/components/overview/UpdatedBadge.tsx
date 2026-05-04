'use client'

import { useEffect, useState } from 'react'
import RefreshIcon from '@mui/icons-material/Refresh'
import Tooltip from '@mui/material/Tooltip'
import { useThemeMode } from '@/styles/useThemeMode'
import styles from './UpdatedBadge.module.css'

interface Props {
  readonly fetchedAt: number | null
  readonly onRefresh: () => void
  readonly disabled?: boolean
}

const TICK_INTERVAL_MS = 30_000
const MS_PER_MINUTE = 60_000
const MINUTES_PER_HOUR = 60
const HOURS_PER_DAY = 24

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
            aria-label="Refresh data"
          >
            <RefreshIcon fontSize="small" />
          </button>
        </span>
      </Tooltip>
    </div>
  )
}

function formatTimestamp(ms: number): string {
  const d = new Date(ms)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function formatAgo(deltaMs: number): string {
  if (deltaMs < MS_PER_MINUTE) {
    return 'just now'
  }
  const minutes = Math.floor(deltaMs / MS_PER_MINUTE)
  if (minutes < MINUTES_PER_HOUR) {
    return `${minutes}m ago`
  }
  const hours = Math.floor(minutes / MINUTES_PER_HOUR)
  if (hours < HOURS_PER_DAY) {
    return `${hours}h ago`
  }
  const days = Math.floor(hours / HOURS_PER_DAY)
  return `${days}d ago`
}

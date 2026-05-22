'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import type { StatusFilter } from '@/lib/gateways/MetaAdsGateway'
import styles from './StatusFilterPills.module.css'

interface Props {
  readonly value: StatusFilter
  readonly onChange: (next: StatusFilter) => void
}

interface PillSpec {
  readonly key: StatusFilter
  readonly label: string
  readonly tone?: 'active' | 'paused'
}

const PILLS: readonly PillSpec[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active', tone: 'active' },
  { key: 'paused', label: 'Paused', tone: 'paused' },
]

export default memo(function StatusFilterPills({ value, onChange }: Props): JSX.Element {
  return (
    <Box className={styles.root} role="group" aria-label="Status filter">
      {PILLS.map((p) => (
        <Box
          key={p.key}
          component="button"
          type="button"
          className={styles.pill}
          aria-pressed={value === p.key}
          onClick={() => onChange(p.key)}
        >
          {p.tone && <Box component="span" className={styles.dot} data-tone={p.tone} aria-hidden />}
          {p.label}
        </Box>
      ))}
    </Box>
  )
})

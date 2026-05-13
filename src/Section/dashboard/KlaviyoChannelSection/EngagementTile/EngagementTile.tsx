'use client'

import { memo } from 'react'
import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import { arrowFor, computeTrend } from '@/components/kpi/kpiTrend'
import { formatPercentage } from '@/lib/meta/fx'
import MiniBar from '../MiniBar/MiniBar'
import styles from './EngagementTile.module.css'

interface Props {
  readonly icon: ReactNode
  readonly label: string
  readonly totalValue: string
  readonly delta?: number
  readonly deltaLabel: string
  readonly campaignsValue: string
  readonly campaignsPercent: number
  readonly flowsValue: string
  readonly flowsPercent: number
}

export default memo(function EngagementTile({
  icon,
  label,
  totalValue,
  delta,
  deltaLabel,
  campaignsValue,
  campaignsPercent,
  flowsValue,
  flowsPercent,
}: Props): JSX.Element {
  const trend = computeTrend(delta)
  return (
    <Box className={styles.tile}>
      <Box className={styles.header}>
        <Box component="span" className={styles.icon} aria-hidden="true">
          {icon}
        </Box>
        <Box component="span" className={styles.label}>
          {label}
        </Box>
      </Box>
      <Box className={styles.valueRow}>
        <Box component="span" className={styles.value}>
          {totalValue}
        </Box>
        {delta !== undefined && (
          <Box component="span" className={styles.delta} data-trend={trend}>
            {arrowFor(delta)} {formatPercentage(Math.abs(delta), 0)} {deltaLabel}
          </Box>
        )}
      </Box>
      <Box className={styles.bars}>
        <MiniBar
          channel="campaigns"
          label="Campaigns"
          value={campaignsValue}
          percent={campaignsPercent}
        />
        <MiniBar
          channel="flows"
          label="Flows"
          value={flowsValue}
          percent={flowsPercent}
        />
      </Box>
    </Box>
  )
})

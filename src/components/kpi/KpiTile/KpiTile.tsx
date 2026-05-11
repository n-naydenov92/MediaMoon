'use client'

import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import { formatPercentage } from '@/lib/meta/fx'
import KpiSparkline, { type SparkPoint } from '../KpiSparkline'
import { arrowFor, computeTrend } from '../kpiTrend'
import styles from './KpiTile.module.css'

interface Props {
  readonly label: string
  readonly value: string
  readonly title?: string
  readonly delta?: number
  readonly deltaLabel?: string
  readonly points?: readonly SparkPoint[]
  readonly formatValue?: (value: number) => string
}

export default function KpiTile({
  label,
  value,
  title,
  delta,
  deltaLabel = 'wow',
  points,
  formatValue,
}: Props): JSX.Element {
  const trend = computeTrend(delta)
  const labelEl = (
    <Box component="span" className={styles.label}>
      {label}
    </Box>
  )
  return (
    <Box className={styles.tile}>
      {title ? (
        <Tooltip title={title} placement="top" arrow disableInteractive>
          {labelEl}
        </Tooltip>
      ) : (
        labelEl
      )}
      <Box component="span" className={styles.value}>
        {value}
      </Box>
      {points && formatValue && (
        <KpiSparkline points={points} tone={trend} formatValue={formatValue} />
      )}
      {delta !== undefined && (
        <Box component="span" className={styles.delta} data-trend={trend}>
          {arrowFor(delta)} {formatPercentage(Math.abs(delta), 0)} {deltaLabel}
        </Box>
      )}
    </Box>
  )
}

'use client'

import Box from '@mui/material/Box'
import type { TooltipContentProps } from 'recharts'
import { shortDate } from '@/lib/dateFormat'
import styles from './KpiSparkline.module.css'

interface Props extends TooltipContentProps {
  readonly formatValue: (value: number) => string
}

export default function KpiSparklineTooltip({
  active,
  payload,
  formatValue,
}: Props): JSX.Element | null {
  const point = payload?.[0]
  if (!active || !point) {
    return null
  }
  const value = typeof point.value === 'number' ? point.value : 0
  const date = typeof point.payload?.date === 'string' ? point.payload.date : ''
  return (
    <Box className={styles.tooltip}>
      <Box component="span" className={styles.tooltipDate}>
        {shortDate(date)}
      </Box>
      <Box component="span" className={styles.tooltipValue}>
        {formatValue(value)}
      </Box>
    </Box>
  )
}

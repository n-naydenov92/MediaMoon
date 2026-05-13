'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { TooltipContentProps } from 'recharts'
import { formatTooltipValue } from './helpers'
import styles from '../SpendChart/SpendChart.module.css'

export default function SpendChartTooltip({
  active,
  payload,
  label,
}: TooltipContentProps): JSX.Element | null {
  if (!active || !payload || payload.length === 0) {
    return null
  }
  return (
    <Box className={styles.tooltip}>
      <Box className={styles.tooltipDate}>{String(label ?? '')}</Box>
      {payload.map((entry) => {
        const key =
          typeof entry.dataKey === 'string' || typeof entry.dataKey === 'number'
            ? String(entry.dataKey)
            : String(entry.name ?? '')
        const numericValue = typeof entry.value === 'number' ? entry.value : 0
        return (
          <Box key={key} className={styles.tooltipRow}>
            <Box component="span" className={styles.tooltipDot} data-key={key} />
            <Typography component="span" variant="inherit" className={styles.tooltipLabel}>{entry.name}</Typography>
            <Typography component="span" variant="inherit" className={styles.tooltipValue}>{formatTooltipValue(key, numericValue)}</Typography>
          </Box>
        )
      })}
    </Box>
  )
}

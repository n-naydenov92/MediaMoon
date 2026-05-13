'use client'

import type { TooltipContentProps } from 'recharts'
import { formatEur, formatRoas } from '@/lib/meta/fx'
import styles from '../SpendChart/SpendChart.module.css'

const ROAS_KEY = 'roas'

export default function SpendChartTooltip({
  active,
  payload,
  label,
}: TooltipContentProps): JSX.Element | null {
  if (!active || !payload || payload.length === 0) {
    return null
  }
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipDate}>{String(label ?? '')}</div>
      {payload.map((entry) => {
        const key =
          typeof entry.dataKey === 'string' || typeof entry.dataKey === 'number'
            ? String(entry.dataKey)
            : String(entry.name ?? '')
        const numericValue = typeof entry.value === 'number' ? entry.value : 0
        return (
          <div key={key} className={styles.tooltipRow}>
            <span className={styles.tooltipDot} data-key={key} />
            <span className={styles.tooltipLabel}>{entry.name}</span>
            <span className={styles.tooltipValue}>{formatTooltipValue(key, numericValue)}</span>
          </div>
        )
      })}
    </div>
  )
}

function formatTooltipValue(key: string, value: number): string {
  if (key === ROAS_KEY) {
    return formatRoas(value)
  }
  return formatEur(value)
}

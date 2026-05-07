import { formatPercentage } from '@/lib/meta/fx'
import KpiSparkline from '../overview/KpiSparkline'
import { arrowFor, computeTrend } from './kpiTrend'
import type { SparkPoint } from '../overview/KpiSparkline'
import styles from './KpiTile.module.css'

interface Props {
  readonly label: string
  readonly value: string
  readonly delta?: number
  readonly deltaLabel?: string
  readonly points?: readonly SparkPoint[]
  readonly formatValue?: (value: number) => string
}

export default function KpiTile({
  label,
  value,
  delta,
  deltaLabel = 'wow',
  points,
  formatValue,
}: Props): JSX.Element {
  const trend = computeTrend(delta)
  return (
    <div className={styles.tile}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      {points && formatValue && (
        <KpiSparkline points={points} tone={trend} formatValue={formatValue} />
      )}
      {delta !== undefined && (
        <span className={styles.delta} data-trend={trend}>
          {arrowFor(delta)} {formatPercentage(Math.abs(delta), 0)} {deltaLabel}
        </span>
      )}
    </div>
  )
}

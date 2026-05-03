import { formatPercentage } from '@/lib/meta/fx'
import styles from './KpiTile.module.css'

export type KpiDirection = 'higher-better' | 'lower-better'

type KpiTrend = 'up' | 'down' | 'flat'

const FLAT_THRESHOLD = 0.005

interface Props {
  readonly label: string
  readonly value: string
  readonly delta?: number
  readonly direction?: KpiDirection
}

export default function KpiTile({
  label,
  value,
  delta,
  direction = 'higher-better',
}: Props): JSX.Element {
  const trend = computeTrend(delta, direction)
  return (
    <div className={styles.tile}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      {delta !== undefined && (
        <span className={styles.delta} data-trend={trend}>
          {arrowFor(delta)} {formatPercentage(Math.abs(delta), 0)} wow
        </span>
      )}
    </div>
  )
}

function computeTrend(delta: number | undefined, direction: KpiDirection): KpiTrend {
  if (delta === undefined || Math.abs(delta) < FLAT_THRESHOLD) {
    return 'flat'
  }
  const positive = delta > 0
  if (direction === 'higher-better') {
    return positive ? 'up' : 'down'
  }
  return positive ? 'down' : 'up'
}

function arrowFor(delta: number): string {
  if (Math.abs(delta) < FLAT_THRESHOLD) {
    return '–'
  }
  return delta > 0 ? '▲' : '▼'
}

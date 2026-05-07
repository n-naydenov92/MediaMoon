import { formatPercentage } from '@/lib/meta/fx'
import KpiSparkline, {
  type SparklineTone,
  type SparkPoint,
} from '../overview/KpiSparkline'
import styles from './KpiTile.module.css'

type KpiTrend = 'up' | 'down' | 'flat'

const FLAT_THRESHOLD = 0.005

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
        <KpiSparkline points={points} tone={trend as SparklineTone} formatValue={formatValue} />
      )}
      {delta !== undefined && (
        <span className={styles.delta} data-trend={trend}>
          {arrowFor(delta)} {formatPercentage(Math.abs(delta), 0)} {deltaLabel}
        </span>
      )}
    </div>
  )
}

function computeTrend(delta: number | undefined): KpiTrend {
  if (delta === undefined || Math.abs(delta) < FLAT_THRESHOLD) {
    return 'flat'
  }
  return delta > 0 ? 'up' : 'down'
}

function arrowFor(delta: number): string {
  if (Math.abs(delta) < FLAT_THRESHOLD) {
    return '–'
  }
  return delta > 0 ? '▲' : '▼'
}

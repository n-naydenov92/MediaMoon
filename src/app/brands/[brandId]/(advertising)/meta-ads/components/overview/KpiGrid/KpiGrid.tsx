import { relativeDelta, type DailyPoint, type KpiDelta } from '@/lib/meta/aggregate'
import { KpiTile, type SparkPoint } from '@/components/kpi'
import { KPI_TILE_SPECS } from '../kpiTileSpecs'
import styles from './KpiGrid.module.css'

interface Props {
  readonly kpis: KpiDelta
  readonly deltaLabel: string
  readonly compareEnabled: boolean
  readonly byDay: readonly DailyPoint[]
}

export default function KpiGrid({ kpis, deltaLabel, compareEnabled, byDay }: Props): JSX.Element {
  const { current, previous } = kpis
  return (
    <div className={styles.grid}>
      {KPI_TILE_SPECS.map((spec) => {
        const { readDaily } = spec
        const points: readonly SparkPoint[] | undefined = readDaily
          ? byDay.map((point) => ({ date: point.date, value: readDaily(point) }))
          : undefined
        const delta = compareEnabled
          ? relativeDelta(spec.read(current), spec.read(previous))
          : undefined
        return (
          <KpiTile
            key={spec.key}
            label={spec.label}
            value={spec.format(current)}
            delta={delta}
            deltaLabel={deltaLabel}
            points={points}
            formatValue={spec.formatDaily}
          />
        )
      })}
    </div>
  )
}

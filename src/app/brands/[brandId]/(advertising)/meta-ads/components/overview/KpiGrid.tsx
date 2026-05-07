import {
  relativeDelta,
  type AggregatedKpis,
  type DailyPoint,
  type KpiDelta,
} from '@/lib/meta/aggregate'
import { formatCompactNumber, formatEur, formatPercentage, formatRoas } from '@/lib/meta/fx'
import KpiTile from '../shared/KpiTile'
import type { SparkPoint } from './KpiSparkline'
import styles from './KpiGrid.module.css'

interface Props {
  readonly kpis: KpiDelta
  readonly deltaLabel: string
  readonly compareEnabled: boolean
  readonly byDay: readonly DailyPoint[]
}

interface KpiTileSpec {
  readonly key: string
  readonly label: string
  readonly format: (kpis: AggregatedKpis) => string
  readonly read: (kpis: AggregatedKpis) => number
  readonly readDaily?: (point: DailyPoint) => number
  readonly formatDaily?: (value: number) => string
}

const TILE_SPECS: readonly KpiTileSpec[] = [
  {
    key: 'spend',
    label: 'Spend',
    format: (k) => formatEur(k.spendEur),
    read: (k) => k.spendEur,
    readDaily: (p) => p.spendEur,
    formatDaily: (v) => formatEur(v),
  },
  {
    key: 'revenue',
    label: 'Revenue',
    format: (k) => formatEur(k.revenueEur),
    read: (k) => k.revenueEur,
    readDaily: (p) => p.revenueEur,
    formatDaily: (v) => formatEur(v),
  },
  {
    key: 'roas',
    label: 'ROAS',
    format: (k) => formatRoas(k.roas),
    read: (k) => k.roas,
    readDaily: (p) => (p.spendEur > 0 ? p.revenueEur / p.spendEur : 0),
    formatDaily: (v) => formatRoas(v),
  },
  {
    key: 'purchases',
    label: 'Purchases',
    format: (k) => formatCompactNumber(k.purchases),
    read: (k) => k.purchases,
    readDaily: (p) => p.purchases,
    formatDaily: (v) => formatCompactNumber(v),
  },
  {
    key: 'linkCtr',
    label: 'Link CTR',
    format: (k) => formatPercentage(k.linkCtr),
    read: (k) => k.linkCtr,
  },
  {
    key: 'costPerLpv',
    label: 'Cost / LPV',
    format: (k) => formatEur(k.costPerLpvEur),
    read: (k) => k.costPerLpvEur,
  },
  {
    key: 'addsToCart',
    label: 'Adds to Cart',
    format: (k) => formatCompactNumber(k.addsToCart),
    read: (k) => k.addsToCart,
  },
  {
    key: 'checkoutsInitiated',
    label: 'Checkouts Initiated',
    format: (k) => formatCompactNumber(k.checkoutsInitiated),
    read: (k) => k.checkoutsInitiated,
  },
]

export default function KpiGrid({ kpis, deltaLabel, compareEnabled, byDay }: Props): JSX.Element {
  const { current, previous } = kpis
  return (
    <div className={styles.grid}>
      {TILE_SPECS.map((spec) => {
        const readDaily = spec.readDaily
        const points: readonly SparkPoint[] | undefined = readDaily
          ? byDay.map((p) => ({ date: p.date, value: readDaily(p) }))
          : undefined
        return (
          <KpiTile
            key={spec.key}
            label={spec.label}
            value={spec.format(current)}
            delta={
              compareEnabled ? relativeDelta(spec.read(current), spec.read(previous)) : undefined
            }
            deltaLabel={deltaLabel}
            points={points}
            formatValue={spec.formatDaily}
          />
        )
      })}
    </div>
  )
}

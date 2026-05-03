import { relativeDelta, type AggregatedKpis, type KpiDelta } from '@/lib/meta/aggregate'
import { formatCompactNumber, formatEur, formatPercentage, formatRoas } from '@/lib/meta/fx'
import KpiTile, { type KpiDirection } from '../shared/KpiTile'
import styles from './KpiGrid.module.css'

interface Props {
  readonly kpis: KpiDelta
}

interface KpiTileSpec {
  readonly key: string
  readonly label: string
  readonly format: (kpis: AggregatedKpis) => string
  readonly read: (kpis: AggregatedKpis) => number
  readonly direction?: KpiDirection
}

const TILE_SPECS: readonly KpiTileSpec[] = [
  { key: 'spend', label: 'Spend', format: (k) => formatEur(k.spendEur), read: (k) => k.spendEur, direction: 'lower-better' },
  { key: 'revenue', label: 'Revenue', format: (k) => formatEur(k.revenueEur), read: (k) => k.revenueEur },
  { key: 'roas', label: 'ROAS', format: (k) => formatRoas(k.roas), read: (k) => k.roas },
  { key: 'purchases', label: 'Purchases', format: (k) => formatCompactNumber(k.purchases), read: (k) => k.purchases },
  { key: 'impressions', label: 'Impressions', format: (k) => formatCompactNumber(k.impressions), read: (k) => k.impressions },
  { key: 'clicks', label: 'Clicks', format: (k) => formatCompactNumber(k.clicks), read: (k) => k.clicks },
  { key: 'ctr', label: 'CTR', format: (k) => formatPercentage(k.ctr), read: (k) => k.ctr },
  { key: 'cpm', label: 'CPM', format: (k) => formatEur(k.cpmEur), read: (k) => k.cpmEur, direction: 'lower-better' },
]

export default function KpiGrid({ kpis }: Props): JSX.Element {
  const { current, previous } = kpis
  return (
    <div className={styles.grid}>
      {TILE_SPECS.map((spec) => (
        <KpiTile
          key={spec.key}
          label={spec.label}
          value={spec.format(current)}
          delta={relativeDelta(spec.read(current), spec.read(previous))}
          direction={spec.direction}
        />
      ))}
    </div>
  )
}

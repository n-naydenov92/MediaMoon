import Box from '@mui/material/Box'
import { KpiTile, type SparkPoint } from '@/components/kpi'
import { formatEur } from '@/lib/meta/fx'
import type {
  DashboardDailyPoint,
  DashboardKpiDeltas,
  DashboardKpis,
} from '@/types/dashboard'
import {
  formatInteger,
  formatIntegerValue,
  formatMoney,
  formatRate,
  formatRoas,
  formatRoasValue,
} from '../shared/dashboardFormatters'
import { toSparkPoints } from '../shared/sparkPoints'
import styles from './DashboardKpiGrid.module.css'

interface Props {
  readonly kpis: DashboardKpis
  readonly deltas: DashboardKpiDeltas
  readonly byDay: readonly DashboardDailyPoint[]
  readonly deltaLabel: string
  readonly comparisonEnabled: boolean
  readonly showSparklines: boolean
}

export default function DashboardKpiGrid({
  kpis,
  deltas,
  byDay,
  deltaLabel,
  comparisonEnabled,
  showSparklines,
}: Props): JSX.Element {
  const passDelta = (value: number | null): number | undefined =>
    !comparisonEnabled || value === null ? undefined : value
  const sparkPoints = (
    selector: (point: DashboardDailyPoint) => number | null,
    isAvailable: boolean,
  ): readonly SparkPoint[] | undefined =>
    showSparklines && isAvailable ? toSparkPoints(byDay, selector) : undefined

  return (
    <Box className={styles.grid}>
      <KpiTile
        label="Total Spend"
        title="Total ad spend in EUR. Source: Meta Ads (Google Ads pending integration)."
        value={formatMoney(kpis.spend)}
        delta={passDelta(deltas.spend)}
        deltaLabel={deltaLabel}
        points={sparkPoints((p) => p.spend, kpis.spend !== null)}
        formatValue={formatEur}
      />
      <KpiTile
        label="Revenue"
        title="Net store revenue (total − shipping) for paid orders. Source: WooCommerce."
        value={formatMoney(kpis.revenue)}
        delta={passDelta(deltas.revenue)}
        deltaLabel={deltaLabel}
        points={sparkPoints((p) => p.revenue, kpis.revenue !== null)}
        formatValue={formatEur}
      />
      <KpiTile
        label="ROAS"
        title="Return on Ad Spend = Woo revenue ÷ Meta ad spend."
        value={formatRoas(kpis.roas)}
        delta={passDelta(deltas.roas)}
        deltaLabel={deltaLabel}
        points={sparkPoints(roasOfDay, kpis.roas !== null)}
        formatValue={formatRoasValue}
      />
      <KpiTile
        label="Orders"
        title="Count of paid orders in the period. Source: WooCommerce."
        value={formatInteger(kpis.orders)}
        delta={passDelta(deltas.orders)}
        deltaLabel={deltaLabel}
        points={sparkPoints((p) => p.orders, kpis.orders !== null)}
        formatValue={formatIntegerValue}
      />
      <KpiTile
        label="Conversion Rate"
        title="Average daily CR = Woo orders ÷ GA4 active users, averaged across days."
        value={formatRate(kpis.conversionRate)}
        delta={passDelta(deltas.conversionRate)}
        deltaLabel={deltaLabel}
      />
      <KpiTile
        label="Cost per User"
        title="Meta ad spend ÷ GA4 active users in the period."
        value={formatMoney(kpis.costPerUser)}
        delta={passDelta(deltas.costPerUser)}
        deltaLabel={deltaLabel}
      />
      <KpiTile
        label="Average Order Value"
        title="Woo revenue ÷ Woo orders count."
        value={formatMoney(kpis.aov)}
        delta={passDelta(deltas.aov)}
        deltaLabel={deltaLabel}
      />
      <KpiTile
        label="Cost per Order"
        title="Meta ad spend ÷ Woo orders count."
        value={formatMoney(kpis.cpo)}
        delta={passDelta(deltas.cpo)}
        deltaLabel={deltaLabel}
      />
    </Box>
  )
}

function roasOfDay(p: DashboardDailyPoint): number | null {
  if (p.revenue === null || p.spend === null || p.spend <= 0) {
    return null
  }
  return p.revenue / p.spend
}

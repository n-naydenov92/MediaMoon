import Box from '@mui/material/Box'
import { KpiTile, type SparkPoint } from '@/components/kpi'
import { formatEur, formatPercentage } from '@/lib/meta/fx'
import type {
  DashboardDailyPoint,
  DashboardKpiDeltas,
  DashboardKpis,
} from '@/types/dashboard'
import styles from './DashboardKpiGrid.module.css'

interface Props {
  readonly kpis: DashboardKpis
  readonly deltas: DashboardKpiDeltas
  readonly byDay: readonly DashboardDailyPoint[]
  readonly deltaLabel: string
  readonly comparisonEnabled: boolean
  readonly showSparklines: boolean
}

const PLACEHOLDER = '—'

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
    build: (byDay: readonly DashboardDailyPoint[]) => readonly SparkPoint[],
    isAvailable: boolean,
  ): readonly SparkPoint[] | undefined =>
    showSparklines && isAvailable ? build(byDay) : undefined

  return (
    <Box className={styles.grid}>
      <KpiTile
        label="Spend"
        value={formatMoney(kpis.spend)}
        delta={passDelta(deltas.spend)}
        deltaLabel={deltaLabel}
        points={sparkPoints(buildSpendPoints, kpis.spend !== null)}
        formatValue={formatEur}
      />
      <KpiTile
        label="Revenue"
        value={formatMoney(kpis.revenue)}
        delta={passDelta(deltas.revenue)}
        deltaLabel={deltaLabel}
        points={sparkPoints(buildRevenuePoints, kpis.revenue !== null)}
        formatValue={formatEur}
      />
      <KpiTile
        label="ROAS"
        title="Return on Ad Spend"
        value={formatRoas(kpis.roas)}
        delta={passDelta(deltas.roas)}
        deltaLabel={deltaLabel}
        points={sparkPoints(buildRoasPoints, kpis.roas !== null)}
        formatValue={formatRoasValue}
      />
      <KpiTile
        label="Orders"
        value={formatInteger(kpis.orders)}
        delta={passDelta(deltas.orders)}
        deltaLabel={deltaLabel}
        points={sparkPoints(buildOrdersPoints, kpis.orders !== null)}
        formatValue={formatIntegerValue}
      />
      <KpiTile
        label="Average Order Value"
        title="Average Order Value"
        value={formatMoney(kpis.aov)}
        delta={passDelta(deltas.aov)}
        deltaLabel={deltaLabel}
      />
      <KpiTile
        label="Cost per Order"
        title="Cost per Order"
        value={formatMoney(kpis.cpo)}
        delta={passDelta(deltas.cpo)}
        deltaLabel={deltaLabel}
      />
      <KpiTile
        label="Conversion Rate"
        title="Orders ÷ sessions (Google Analytics)"
        value={formatRate(kpis.conversionRate)}
        delta={passDelta(deltas.conversionRate)}
        deltaLabel={deltaLabel}
      />
      <KpiTile
        label="Cost per User"
        title="Spend ÷ active users (Google Analytics)"
        value={formatMoney(kpis.costPerUser)}
        delta={passDelta(deltas.costPerUser)}
        deltaLabel={deltaLabel}
      />
    </Box>
  )
}

function buildSpendPoints(byDay: readonly DashboardDailyPoint[]): readonly SparkPoint[] {
  return byDay.map((p) => ({ date: p.date, value: p.spend ?? 0 }))
}

function buildRevenuePoints(byDay: readonly DashboardDailyPoint[]): readonly SparkPoint[] {
  return byDay.map((p) => ({ date: p.date, value: p.revenue ?? 0 }))
}

function buildOrdersPoints(byDay: readonly DashboardDailyPoint[]): readonly SparkPoint[] {
  return byDay.map((p) => ({ date: p.date, value: p.orders ?? 0 }))
}

function buildRoasPoints(byDay: readonly DashboardDailyPoint[]): readonly SparkPoint[] {
  return byDay.map((p) => {
    const value = p.revenue !== null && p.spend !== null && p.spend > 0 ? p.revenue / p.spend : 0
    return { date: p.date, value }
  })
}

function formatMoney(value: number | null): string {
  return value === null ? PLACEHOLDER : formatEur(value)
}

function formatInteger(value: number | null): string {
  return value === null
    ? PLACEHOLDER
    : value.toLocaleString('en-GB', { maximumFractionDigits: 0 })
}

function formatIntegerValue(value: number): string {
  return value.toLocaleString('en-GB', { maximumFractionDigits: 0 })
}

function formatRoas(value: number | null): string {
  return value === null ? PLACEHOLDER : `${value.toFixed(2)}x`
}

function formatRoasValue(value: number): string {
  return `${value.toFixed(2)}x`
}

function formatRate(value: number | null): string {
  return value === null ? PLACEHOLDER : formatPercentage(value, 2)
}

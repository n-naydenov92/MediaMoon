import { formatEur, formatPercentage } from '@/lib/meta/fx'
import type { DashboardDailyPoint } from '@/types/dashboard'

export const THIRD_METRICS = [
  'roas',
  'orders',
  'conversionRate',
  'costPerUser',
  'aov',
  'cpo',
] as const

export type ThirdMetric = (typeof THIRD_METRICS)[number]

export interface MetricSpec {
  readonly label: string
  readonly axis: 'eur' | 'right'
  readonly tickFormat: (v: number) => string
  readonly tooltipFormat: (v: number) => string
  readonly requiresCommerce: boolean
  readonly requiresAnalytics: boolean
  readonly extract: (row: ChartRow) => number | null
}

export interface ChartRow {
  readonly date: string
  readonly spend: number | null
  readonly revenue: number | null
  readonly orders: number | null
  readonly activeUsers: number | null
  readonly roas: number | null
  readonly aov: number | null
  readonly cpo: number | null
  readonly conversionRate: number | null
  readonly costPerUser: number | null
  readonly thirdValue: number | null
}

export function shortMoney(value: number): string {
  if (value >= 1000) {
    return `€${(value / 1000).toFixed(1)}k`
  }
  return `€${value.toFixed(0)}`
}

export const METRIC_CONFIG: Record<ThirdMetric, MetricSpec> = {
  roas: {
    label: 'ROAS',
    axis: 'right',
    tickFormat: (v) => `${v.toFixed(1)}x`,
    tooltipFormat: (v) => `${v.toFixed(2)}x`,
    requiresCommerce: true,
    requiresAnalytics: false,
    extract: (r) => r.roas,
  },
  orders: {
    label: 'Orders',
    axis: 'right',
    tickFormat: (v) => v.toLocaleString('en-GB', { maximumFractionDigits: 0 }),
    tooltipFormat: (v) => v.toLocaleString('en-GB', { maximumFractionDigits: 0 }),
    requiresCommerce: true,
    requiresAnalytics: false,
    extract: (r) => r.orders,
  },
  conversionRate: {
    label: 'Conversion Rate',
    axis: 'right',
    tickFormat: (v) => formatPercentage(v, 1),
    tooltipFormat: (v) => formatPercentage(v, 2),
    requiresCommerce: true,
    requiresAnalytics: true,
    extract: (r) => r.conversionRate,
  },
  costPerUser: {
    label: 'Cost per User',
    axis: 'eur',
    tickFormat: shortMoney,
    tooltipFormat: formatEur,
    requiresCommerce: false,
    requiresAnalytics: true,
    extract: (r) => r.costPerUser,
  },
  aov: {
    label: 'Average Order Value',
    axis: 'eur',
    tickFormat: shortMoney,
    tooltipFormat: formatEur,
    requiresCommerce: true,
    requiresAnalytics: false,
    extract: (r) => r.aov,
  },
  cpo: {
    label: 'Cost per Order',
    axis: 'eur',
    tickFormat: shortMoney,
    tooltipFormat: formatEur,
    requiresCommerce: true,
    requiresAnalytics: false,
    extract: (r) => r.cpo,
  },
}

export function availableMetrics(
  hasCommerce: boolean,
  hasAnalytics: boolean,
): readonly ThirdMetric[] {
  return THIRD_METRICS.filter((m) => {
    const cfg = METRIC_CONFIG[m]
    if (cfg.requiresCommerce && !hasCommerce) {
      return false
    }
    if (cfg.requiresAnalytics && !hasAnalytics) {
      return false
    }
    return true
  })
}

export function enrichDaily(
  data: readonly DashboardDailyPoint[],
  metric: ThirdMetric | undefined,
): readonly ChartRow[] {
  return data.map((d) => {
    const roas = d.revenue !== null && d.spend !== null && d.spend > 0 ? d.revenue / d.spend : null
    const aov = d.revenue !== null && d.orders !== null && d.orders > 0 ? d.revenue / d.orders : null
    const cpo = d.spend !== null && d.orders !== null && d.orders > 0 ? d.spend / d.orders : null
    const conversionRate =
      d.orders !== null && d.sessions !== null && d.sessions > 0 ? d.orders / d.sessions : null
    const costPerUser =
      d.spend !== null && d.activeUsers !== null && d.activeUsers > 0
        ? d.spend / d.activeUsers
        : null
    const row: Omit<ChartRow, 'thirdValue'> = {
      date: d.date,
      spend: d.spend,
      revenue: d.revenue,
      orders: d.orders,
      activeUsers: d.activeUsers,
      roas,
      aov,
      cpo,
      conversionRate,
      costPerUser,
    }
    return { ...row, thirdValue: metric ? METRIC_CONFIG[metric].extract(row as ChartRow) : null }
  })
}

import { relativeDelta } from '@/lib/meta/aggregate'
import type {
  DashboardDailyPoint,
  DashboardKpiDeltas,
  DashboardKpis,
  SpendBreakdownPoint,
} from '@/types/dashboard'

export interface CommerceTotals {
  readonly revenueEur: number
  readonly ordersCount: number
  readonly byDay: readonly { readonly date: string; readonly revenueEur: number; readonly orders: number }[]
}

export interface SpendTotals {
  readonly spendEur: number
  readonly byDay: readonly { readonly date: string; readonly spendEur: number }[]
}

export interface AnalyticsTotalsForAggregate {
  readonly sessions: number
  readonly activeUsers: number
  readonly byDay: readonly { readonly date: string; readonly sessions: number; readonly activeUsers: number }[]
}

export function combineKpis(
  spend: SpendTotals,
  commerce: CommerceTotals | null,
  analytics: AnalyticsTotalsForAggregate | null,
): DashboardKpis {
  const { spendEur } = spend
  const revenue = commerce?.revenueEur ?? null
  const orders = commerce?.ordersCount ?? null
  const sessions = analytics?.sessions ?? null
  const activeUsers = analytics?.activeUsers ?? null
  const roas = revenue !== null && spendEur > 0 ? revenue / spendEur : null
  const aov = revenue !== null && orders !== null && orders > 0 ? revenue / orders : null
  const cpo = orders !== null && orders > 0 && spendEur > 0 ? spendEur / orders : null
  const conversionRate =
    orders !== null && sessions !== null && sessions > 0 ? orders / sessions : null
  const costPerUser =
    activeUsers !== null && activeUsers > 0 && spendEur > 0 ? spendEur / activeUsers : null
  return { spend: spendEur, revenue, roas, orders, aov, cpo, conversionRate, costPerUser }
}

export function computeDeltas(current: DashboardKpis, previous: DashboardKpis): DashboardKpiDeltas {
  return {
    spend: deltaOrNull(current.spend, previous.spend),
    revenue: deltaOrNull(current.revenue, previous.revenue),
    roas: deltaOrNull(current.roas, previous.roas),
    orders: deltaOrNull(current.orders, previous.orders),
    aov: deltaOrNull(current.aov, previous.aov),
    cpo: deltaOrNull(current.cpo, previous.cpo),
    conversionRate: deltaOrNull(current.conversionRate, previous.conversionRate),
    costPerUser: deltaOrNull(current.costPerUser, previous.costPerUser),
  }
}

export function mergeDailyPoints(
  spendByDay: SpendTotals['byDay'],
  commerceByDay: CommerceTotals['byDay'] | null,
  analyticsByDay: AnalyticsTotalsForAggregate['byDay'] | null,
): readonly DashboardDailyPoint[] {
  const dates = new Set<string>()
  for (const p of spendByDay) {
    dates.add(p.date)
  }
  for (const p of commerceByDay ?? []) {
    dates.add(p.date)
  }
  for (const p of analyticsByDay ?? []) {
    dates.add(p.date)
  }
  const spendMap = new Map(spendByDay.map((p) => [p.date, p.spendEur]))
  const revenueMap = new Map((commerceByDay ?? []).map((p) => [p.date, p.revenueEur]))
  const ordersMap = new Map((commerceByDay ?? []).map((p) => [p.date, p.orders]))
  const sessionsMap = new Map((analyticsByDay ?? []).map((p) => [p.date, p.sessions]))
  const usersMap = new Map((analyticsByDay ?? []).map((p) => [p.date, p.activeUsers]))
  return Array.from(dates)
    .sort((a, b) => a.localeCompare(b))
    .map((date) => ({
      date,
      spend: spendMap.has(date) ? spendMap.get(date) ?? 0 : null,
      revenue: commerceByDay === null ? null : revenueMap.get(date) ?? 0,
      orders: commerceByDay === null ? null : ordersMap.get(date) ?? 0,
      sessions: analyticsByDay === null ? null : sessionsMap.get(date) ?? 0,
      activeUsers: analyticsByDay === null ? null : usersMap.get(date) ?? 0,
    }))
}

export function buildSpendBreakdown(meta: SpendTotals): readonly SpendBreakdownPoint[] {
  // Google Ads is a Phase 3 placeholder — replace `spend: 0` with real totals
  // once GoogleAdsGateway is wired into fetchSpendBothPeriods.
  return [
    { channel: 'meta', label: 'Meta', spend: meta.spendEur },
    { channel: 'googleAds', label: 'Google Ads', spend: 0 },
  ]
}

function deltaOrNull(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null) {
    return null
  }
  return relativeDelta(current, previous)
}

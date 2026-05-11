import { relativeDelta } from '@/lib/meta/aggregate'
import type { DashboardKpiDeltas, DashboardKpis } from '@/types/dashboard'
import type { AnalyticsTotalsForAggregate, CommerceTotals, SpendTotals } from './types'

export function combineKpis(
  spend: SpendTotals,
  commerce: CommerceTotals | null,
  analytics: AnalyticsTotalsForAggregate | null,
): DashboardKpis {
  const { spendEur } = spend
  const revenue = commerce?.revenueEur ?? null
  const orders = commerce?.ordersCount ?? null
  const activeUsers = analytics?.activeUsers ?? null
  const roas = revenue !== null && spendEur > 0 ? revenue / spendEur : null
  const aov = revenue !== null && orders !== null && orders > 0 ? revenue / orders : null
  const cpo = orders !== null && orders > 0 && spendEur > 0 ? spendEur / orders : null
  const conversionRate =
    orders !== null && activeUsers !== null && activeUsers > 0 ? orders / activeUsers : null
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

function deltaOrNull(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null) {
    return null
  }
  return relativeDelta(current, previous)
}

import type { DashboardDailyPoint } from '@/types/dashboard'
import type { AnalyticsTotalsForAggregate, CommerceTotals, SpendTotals } from './types'

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
  const newUsersMap = new Map((analyticsByDay ?? []).map((p) => [p.date, p.newUsers]))
  const ftpMap = new Map((analyticsByDay ?? []).map((p) => [p.date, p.firstTimePurchasers]))
  const bounceMap = new Map((analyticsByDay ?? []).map((p) => [p.date, p.bounceRate]))
  return Array.from(dates)
    .sort((a, b) => a.localeCompare(b))
    .map((date) => ({
      date,
      spend: spendMap.has(date) ? spendMap.get(date) ?? 0 : null,
      revenue: commerceByDay === null ? null : revenueMap.get(date) ?? 0,
      orders: commerceByDay === null ? null : ordersMap.get(date) ?? 0,
      sessions: analyticsByDay === null ? null : sessionsMap.get(date) ?? 0,
      activeUsers: analyticsByDay === null ? null : usersMap.get(date) ?? 0,
      newUsers: analyticsByDay === null ? null : newUsersMap.get(date) ?? 0,
      firstTimePurchasers: analyticsByDay === null ? null : ftpMap.get(date) ?? 0,
      bounceRate: analyticsByDay === null ? null : bounceMap.get(date) ?? null,
    }))
}

export function averageDailyConversionRate(
  commerce: CommerceTotals | null,
  analytics: AnalyticsTotalsForAggregate | null,
): number | null {
  if (!commerce || !analytics) {
    return null
  }
  const ordersByDate = new Map(commerce.byDay.map((p) => [p.date, p.orders]))
  const dailyRates: number[] = []
  for (const day of analytics.byDay) {
    if (day.activeUsers <= 0) {
      continue
    }
    const orders = ordersByDate.get(day.date) ?? 0
    dailyRates.push(orders / day.activeUsers)
  }
  if (dailyRates.length === 0) {
    return null
  }
  return dailyRates.reduce((acc, v) => acc + v, 0) / dailyRates.length
}

export function averageDailyBounceRate(
  analytics: AnalyticsTotalsForAggregate | null,
): number | null {
  if (!analytics) {
    return null
  }
  const values: number[] = []
  for (const day of analytics.byDay) {
    if (day.bounceRate !== null) {
      values.push(day.bounceRate)
    }
  }
  if (values.length === 0) {
    return null
  }
  return values.reduce((acc, v) => acc + v, 0) / values.length
}

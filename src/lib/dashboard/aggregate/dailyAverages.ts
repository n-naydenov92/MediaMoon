import type { DashboardDailyPoint } from '@/types/dashboard'
import type {
  AnalyticsTotalsForAggregate,
  CommerceTotals,
  GoogleAdsChannelTotals,
  SpendTotals,
} from './types'

export interface DailyPointSources {
  readonly metaSpend: SpendTotals['byDay']
  readonly googleAdsSpend: GoogleAdsChannelTotals['byDay']
  readonly commerce: CommerceTotals['byDay'] | null
  readonly analytics: AnalyticsTotalsForAggregate['byDay'] | null
}

export function mergeDailyPoints(sources: DailyPointSources): readonly DashboardDailyPoint[] {
  const { metaSpend, googleAdsSpend, commerce, analytics } = sources
  const spendMap = new Map(metaSpend.map((p) => [p.date, p.spendEur]))
  const googleAdsSpendMap = new Map(googleAdsSpend.map((p) => [p.date, p.spendEur]))
  const revenueMap = new Map((commerce ?? []).map((p) => [p.date, p.revenueEur]))
  const ordersMap = new Map((commerce ?? []).map((p) => [p.date, p.orders]))
  const sessionsMap = new Map((analytics ?? []).map((p) => [p.date, p.sessions]))
  const usersMap = new Map((analytics ?? []).map((p) => [p.date, p.activeUsers]))
  const newUsersMap = new Map((analytics ?? []).map((p) => [p.date, p.newUsers]))
  const ftpMap = new Map((analytics ?? []).map((p) => [p.date, p.firstTimePurchasers]))
  const bounceMap = new Map((analytics ?? []).map((p) => [p.date, p.bounceRate]))
  return Array.from(collectDates(sources))
    .sort((a, b) => a.localeCompare(b))
    .map((date) => {
      const metaDaySpend = spendMap.get(date)
      const googleDaySpend = googleAdsSpendMap.get(date)
      const spend = metaDaySpend === undefined && googleDaySpend === undefined
        ? null
        : (metaDaySpend ?? 0) + (googleDaySpend ?? 0)
      return {
        date,
        spend,
        revenue: commerce === null ? null : revenueMap.get(date) ?? 0,
        orders: commerce === null ? null : ordersMap.get(date) ?? 0,
        sessions: analytics === null ? null : sessionsMap.get(date) ?? 0,
        activeUsers: analytics === null ? null : usersMap.get(date) ?? 0,
        newUsers: analytics === null ? null : newUsersMap.get(date) ?? 0,
        firstTimePurchasers: analytics === null ? null : ftpMap.get(date) ?? 0,
        bounceRate: analytics === null ? null : bounceMap.get(date) ?? null,
      }
    })
}

function collectDates(sources: DailyPointSources): Set<string> {
  const dates = new Set<string>()
  for (const p of sources.metaSpend) {
    dates.add(p.date)
  }
  for (const p of sources.googleAdsSpend) {
    dates.add(p.date)
  }
  for (const p of sources.commerce ?? []) {
    dates.add(p.date)
  }
  for (const p of sources.analytics ?? []) {
    dates.add(p.date)
  }
  return dates
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

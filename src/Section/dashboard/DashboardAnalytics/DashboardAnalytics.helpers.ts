import type {
  AnalyticsKpis,
  DashboardDailyPoint,
  DashboardKpis,
  FunnelDailyPoint,
} from '@/types/dashboard'

export function deriveAnalyticsKpis(
  kpis: DashboardKpis,
  byDay: readonly DashboardDailyPoint[],
): AnalyticsKpis {
  return {
    sessions: sumNullable(byDay.map((p) => p.sessions)),
    activeUsers: sumNullable(byDay.map((p) => p.activeUsers)),
    newUsers: sumNullable(byDay.map((p) => p.newUsers)),
    firstTimePurchasers: sumNullable(byDay.map((p) => p.firstTimePurchasers)),
    conversionRate: kpis.conversionRate,
    bounceRate: null,
  }
}

export function averageDailyCartAR(funnelByDay: readonly FunnelDailyPoint[]): number | null {
  const values: number[] = []
  for (const day of funnelByDay) {
    if (day.addToCartUsers > 0) {
      values.push(1 - day.purchaseUsers / day.addToCartUsers)
    }
  }
  if (values.length === 0) {
    return null
  }
  return values.reduce((acc, v) => acc + v, 0) / values.length
}

export function averageDailyArpu(byDay: readonly DashboardDailyPoint[]): number | null {
  const values: number[] = []
  for (const day of byDay) {
    const users = day.activeUsers ?? 0
    const revenue = day.revenue ?? 0
    if (users > 0) {
      values.push(revenue / users)
    }
  }
  if (values.length === 0) {
    return null
  }
  return values.reduce((acc, v) => acc + v, 0) / values.length
}

export function computeArpu(
  revenue: number | null,
  activeUsers: number | null | undefined,
): number | null {
  if (revenue === null || activeUsers === null || activeUsers === undefined || activeUsers <= 0) {
    return null
  }
  return revenue / activeUsers
}

export function cartARSelector(day: FunnelDailyPoint): number {
  return day.addToCartUsers > 0 ? 1 - day.purchaseUsers / day.addToCartUsers : 0
}

export function arpuSelector(p: DashboardDailyPoint): number {
  const revenue = p.revenue ?? 0
  const users = p.activeUsers ?? 0
  return users > 0 ? revenue / users : 0
}

function sumNullable(values: readonly (number | null)[]): number | null {
  let total = 0
  let hasData = false
  for (const value of values) {
    if (value !== null) {
      total += value
      hasData = true
    }
  }
  return hasData ? total : null
}

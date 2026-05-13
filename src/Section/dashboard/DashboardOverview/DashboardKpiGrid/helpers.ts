import type { DashboardDailyPoint } from '@/types/dashboard'

export function roasOfDay(p: DashboardDailyPoint): number | null {
  if (p.revenue === null || p.spend === null || p.spend <= 0) {
    return null
  }
  return p.revenue / p.spend
}

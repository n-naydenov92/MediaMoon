import { convertToEur } from '../fx'

export interface DailyPoint {
  readonly date: string
  readonly spendEur: number
  readonly revenueEur: number
  readonly purchases: number
  readonly impressions: number
  readonly clicks: number
}

interface DailyInputPoint {
  readonly date: string
  readonly spend: number
  readonly revenue: number
  readonly purchases: number
  readonly impressions: number
  readonly clicks: number
}

interface DailyAccumulator {
  spendEur: number
  revenueEur: number
  purchases: number
  impressions: number
  clicks: number
}

const EMPTY_DAILY_ACCUMULATOR: DailyAccumulator = {
  spendEur: 0,
  revenueEur: 0,
  purchases: 0,
  impressions: 0,
  clicks: 0,
}

export function sumDailySeries(
  perAccount: readonly { readonly currency: string; readonly daily: readonly DailyInputPoint[] }[],
): readonly DailyPoint[] {
  const byDate = new Map<string, DailyAccumulator>()
  for (const acct of perAccount) {
    for (const point of acct.daily) {
      const existing = byDate.get(point.date) ?? { ...EMPTY_DAILY_ACCUMULATOR }
      byDate.set(point.date, {
        spendEur: existing.spendEur + convertToEur(point.spend, acct.currency),
        revenueEur: existing.revenueEur + convertToEur(point.revenue, acct.currency),
        purchases: existing.purchases + point.purchases,
        impressions: existing.impressions + point.impressions,
        clicks: existing.clicks + point.clicks,
      })
    }
  }
  return Array.from(byDate.entries())
    .map(([date, totals]) => ({ date, ...totals }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

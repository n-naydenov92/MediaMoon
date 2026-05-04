import { convertToEur } from './fx'

export interface AccountKpis {
  readonly accountId: string
  readonly currency: string
  readonly spend: number
  readonly revenue: number
  readonly purchases: number
  readonly impressions: number
  readonly clicks: number
}

export interface AggregatedKpis {
  readonly spendEur: number
  readonly revenueEur: number
  readonly roas: number
  readonly purchases: number
  readonly impressions: number
  readonly clicks: number
  readonly ctr: number
  readonly cpmEur: number
  readonly cpcEur: number
}

export interface KpiDelta {
  readonly current: AggregatedKpis
  readonly previous: AggregatedKpis
  readonly spendDelta: number
  readonly revenueDelta: number
  readonly roasDelta: number
  readonly purchasesDelta: number
}

export function sumKpis(perAccount: readonly AccountKpis[]): AggregatedKpis {
  const totals = perAccount.reduce(
    (acc, a) => ({
      spendEur: acc.spendEur + convertToEur(a.spend, a.currency),
      revenueEur: acc.revenueEur + convertToEur(a.revenue, a.currency),
      purchases: acc.purchases + a.purchases,
      impressions: acc.impressions + a.impressions,
      clicks: acc.clicks + a.clicks,
    }),
    { spendEur: 0, revenueEur: 0, purchases: 0, impressions: 0, clicks: 0 },
  )
  const roas = totals.spendEur > 0 ? totals.revenueEur / totals.spendEur : 0
  const ctr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0
  const cpmEur = totals.impressions > 0 ? (totals.spendEur / totals.impressions) * 1000 : 0
  const cpcEur = totals.clicks > 0 ? totals.spendEur / totals.clicks : 0
  return { ...totals, roas, ctr, cpmEur, cpcEur }
}

export function computeKpiDelta(current: AggregatedKpis, previous: AggregatedKpis): KpiDelta {
  return {
    current,
    previous,
    spendDelta: relativeDelta(current.spendEur, previous.spendEur),
    revenueDelta: relativeDelta(current.revenueEur, previous.revenueEur),
    roasDelta: relativeDelta(current.roas, previous.roas),
    purchasesDelta: relativeDelta(current.purchases, previous.purchases),
  }
}

export function relativeDelta(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 1
  }
  return (current - previous) / previous
}

export interface AdLeaderboardEntry {
  readonly adId: string
  readonly name: string
  readonly creativeType: 'image' | 'video' | 'unknown'
  readonly thumbnailUrl: string | null
  readonly accountId: string
  readonly spendEur: number
  readonly revenueEur: number
  readonly roas: number
  readonly status: string
}

export interface TopCriteria {
  readonly minSpend: number
  readonly topMinRoas: number
  readonly underMaxRoas: number
}

export const DEFAULT_TOP_CRITERIA: TopCriteria = {
  minSpend: 50,
  topMinRoas: 4,
  underMaxRoas: 2,
}

const SHORT_RANGE_MIN_SPEND = 15
const SHORT_RANGE_PRESETS: ReadonlySet<string> = new Set(['today', 'yesterday'])

export function defaultCriteriaForPreset(preset: string): TopCriteria {
  if (SHORT_RANGE_PRESETS.has(preset)) {
    return { ...DEFAULT_TOP_CRITERIA, minSpend: SHORT_RANGE_MIN_SPEND }
  }
  return DEFAULT_TOP_CRITERIA
}

export const CRITERIA_QUERY_KEYS = {
  minSpend: 'minSpend',
  topMinRoas: 'minRoas',
  underMaxRoas: 'underMaxRoas',
} as const

export function pickTopAds(
  ads: readonly AdLeaderboardEntry[],
  criteria: TopCriteria,
  limit: number = 5,
): readonly AdLeaderboardEntry[] {
  return ads
    .filter((a) => a.spendEur >= criteria.minSpend && a.roas >= criteria.topMinRoas)
    .sort((a, b) => b.roas - a.roas)
    .slice(0, limit)
}

export function pickTopByType(
  ads: readonly AdLeaderboardEntry[],
  type: 'image' | 'video',
  criteria: TopCriteria,
  limit: number = 5,
): readonly AdLeaderboardEntry[] {
  return pickTopAds(ads.filter((a) => a.creativeType === type), criteria, limit)
}

export function pickUnderperformers(
  ads: readonly AdLeaderboardEntry[],
  criteria: TopCriteria,
  limit: number = 5,
): readonly AdLeaderboardEntry[] {
  return ads
    .filter((a) => a.spendEur >= criteria.minSpend && a.roas <= criteria.underMaxRoas)
    .sort((a, b) => a.roas - b.roas)
    .slice(0, limit)
}

export interface AccountSummary {
  readonly accountId: string
  readonly accountName: string
  readonly spendEur: number
  readonly revenueEur: number
  readonly roas: number
  readonly activeAdsCount: number
}

export function summarizeAccount(
  account: { readonly id: string; readonly name: string; readonly currency: string },
  spend: number,
  revenue: number,
  activeAdsCount: number,
): AccountSummary {
  const spendEur = convertToEur(spend, account.currency)
  const revenueEur = convertToEur(revenue, account.currency)
  return {
    accountId: account.id,
    accountName: account.name,
    spendEur,
    revenueEur,
    roas: spendEur > 0 ? revenueEur / spendEur : 0,
    activeAdsCount,
  }
}

export interface DailyPoint {
  readonly date: string
  readonly spendEur: number
  readonly revenueEur: number
}

export function sumDailySeries(
  perAccount: readonly { readonly currency: string; readonly daily: readonly { readonly date: string; readonly spend: number; readonly revenue: number }[] }[],
): readonly DailyPoint[] {
  const byDate = new Map<string, { spendEur: number; revenueEur: number }>()
  for (const acct of perAccount) {
    for (const point of acct.daily) {
      const existing = byDate.get(point.date) ?? { spendEur: 0, revenueEur: 0 }
      byDate.set(point.date, {
        spendEur: existing.spendEur + convertToEur(point.spend, acct.currency),
        revenueEur: existing.revenueEur + convertToEur(point.revenue, acct.currency),
      })
    }
  }
  return Array.from(byDate.entries())
    .map(([date, totals]) => ({ date, ...totals }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

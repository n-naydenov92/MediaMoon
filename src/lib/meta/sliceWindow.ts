import type { WindowResponse, AccountWindow } from '@/app/api/meta-ads/window/route'
import type { AdWithDailyInsights, InsightsDailyPoint } from '@/lib/gateways/MetaAdsGateway'
import {
  computeKpiDelta,
  pickTopAds,
  pickTopByType,
  pickUnderperformers,
  sumDailySeries,
  sumKpis,
  summarizeAccount,
  type AccountKpis,
  type AccountSummary,
  type AdLeaderboardEntry,
  type DailyPoint,
  type KpiDelta,
  type TopCriteria,
} from './aggregate'
import { convertToEur } from './fx'
import {
  rangeFromSelection,
  type CustomRange,
  type DateRangeSelection,
} from './dateRange'

export interface OverviewSummary {
  readonly kpis: KpiDelta
  readonly byDay: readonly DailyPoint[]
  readonly byAccount: readonly AccountSummary[]
  readonly topAll: readonly AdLeaderboardEntry[]
  readonly topVideos: readonly AdLeaderboardEntry[]
  readonly topImages: readonly AdLeaderboardEntry[]
  readonly underperformers: readonly AdLeaderboardEntry[]
  readonly criteria: TopCriteria
  readonly fetchedAt: number
}

interface SliceArgs {
  readonly window: WindowResponse
  readonly criteria: TopCriteria
  readonly current: DateRangeSelection
  readonly previous: DateRangeSelection
}

export function sliceWindow({ window, criteria, current, previous }: SliceArgs): OverviewSummary {
  const currentRange = rangeFromSelection(current)
  const previousRange = rangeFromSelection(previous)
  const currentKpis = window.accounts.map((acc) => sliceAccountKpis(acc, currentRange))
  const previousKpis = window.accounts.map((acc) => sliceAccountKpis(acc, previousRange))
  const byAccount = buildAccountSummaries(window.accounts, currentRange)
  const allAdEntries = buildAdLeaderboardEntries(window.accounts, currentRange)
  return {
    kpis: computeKpiDelta(sumKpis(currentKpis), sumKpis(previousKpis)),
    byDay: buildDailySeries(window.accounts, currentRange),
    byAccount,
    topAll: pickTopAds(allAdEntries, criteria),
    topVideos: pickTopByType(allAdEntries, 'video', criteria),
    topImages: pickTopByType(allAdEntries, 'image', criteria),
    underperformers: pickUnderperformers(allAdEntries, criteria),
    criteria,
    fetchedAt: window.fetchedAt,
  }
}

function buildDailySeries(
  accounts: readonly AccountWindow[],
  range: CustomRange,
): readonly DailyPoint[] {
  return sumDailySeries(
    accounts.map((acc) => ({
      currency: acc.currency,
      daily: filterDaily(acc.daily, range).map((d) => ({
        date: d.date,
        spend: d.spend,
        revenue: d.revenue,
      })),
    })),
  )
}

function buildAccountSummaries(
  accounts: readonly AccountWindow[],
  range: CustomRange,
): readonly AccountSummary[] {
  return accounts
    .map((acc) => {
      const totals = sliceAccountTotals(acc, range)
      return summarizeAccount(
        { id: acc.accountId, name: acc.accountName, currency: acc.currency },
        totals.spend,
        totals.revenue,
        countActiveAds(acc.ads, range),
      )
    })
    .sort((a, b) => b.spendEur - a.spendEur)
}

function buildAdLeaderboardEntries(
  accounts: readonly AccountWindow[],
  range: CustomRange,
): readonly AdLeaderboardEntry[] {
  return accounts.flatMap((acc) =>
    acc.ads.map((ad) => toLeaderboardEntry(ad, acc.currency, range)),
  )
}

function filterDaily(
  daily: readonly InsightsDailyPoint[],
  range: CustomRange,
): readonly InsightsDailyPoint[] {
  return daily.filter((d) => d.date >= range.from && d.date <= range.to)
}

function sliceAccountTotals(
  acc: AccountWindow,
  range: CustomRange,
): { spend: number; revenue: number; purchases: number; impressions: number; clicks: number } {
  return filterDaily(acc.daily, range).reduce(
    (totals, d) => ({
      spend: totals.spend + d.spend,
      revenue: totals.revenue + d.revenue,
      purchases: totals.purchases + d.purchases,
      impressions: totals.impressions + d.impressions,
      clicks: totals.clicks + d.clicks,
    }),
    { spend: 0, revenue: 0, purchases: 0, impressions: 0, clicks: 0 },
  )
}

function sliceAccountKpis(acc: AccountWindow, range: CustomRange): AccountKpis {
  const totals = sliceAccountTotals(acc, range)
  return {
    accountId: acc.accountId,
    currency: acc.currency,
    spend: totals.spend,
    revenue: totals.revenue,
    purchases: totals.purchases,
    impressions: totals.impressions,
    clicks: totals.clicks,
  }
}

function countActiveAds(
  ads: readonly AdWithDailyInsights[],
  range: CustomRange,
): number {
  return ads.filter((ad) => {
    if (ad.effectiveStatus !== 'ACTIVE') {
      return false
    }
    return ad.daily.some((d) => d.date >= range.from && d.date <= range.to && d.spend > 0)
  }).length
}

function toLeaderboardEntry(
  ad: AdWithDailyInsights,
  currency: string,
  range: CustomRange,
): AdLeaderboardEntry {
  const totals = ad.daily
    .filter((d) => d.date >= range.from && d.date <= range.to)
    .reduce(
      (acc, d) => ({ spend: acc.spend + d.spend, revenue: acc.revenue + d.revenue }),
      { spend: 0, revenue: 0 },
    )
  const spendEur = convertToEur(totals.spend, currency)
  const revenueEur = convertToEur(totals.revenue, currency)
  return {
    adId: ad.id,
    name: ad.name,
    creativeType: ad.creativeType,
    thumbnailUrl: ad.thumbnailUrl,
    accountId: ad.accountId,
    spendEur,
    revenueEur,
    roas: spendEur > 0 ? revenueEur / spendEur : 0,
    status: ad.effectiveStatus,
  }
}

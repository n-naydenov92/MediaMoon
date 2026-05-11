import { getAdAccountIds } from '@/config/adAccounts'
import type { BrandId } from '@/config/brands'
import { getConfiguredBusinessManagersForBrand } from '@/config/metaTokens'
import { fetchAccountInsights, fetchAdAccounts } from '@/lib/gateways/MetaAdsGateway'
import { convertToEur } from '@/lib/meta/fx'
import { toMetaInsightsParams, type DateRangeSelection } from '@/lib/meta/dateRange'
import type { MarketSelection } from '@/lib/markets'
import type { MetaChannelDailyPoint, MetaChannelTotals, SpendTotals } from './aggregate'

interface AccountTarget {
  readonly token: string
  readonly accountId: string
  readonly currency: string
}

interface DailyAggregate {
  spendEur: number
  revenueEur: number
  purchases: number
  impressions: number
  linkClicks: number
  checkoutsInitiated: number
}

interface PeriodTotals {
  readonly spendEur: number
  readonly revenueEur: number
  readonly purchases: number
  readonly impressions: number
  readonly linkClicks: number
  readonly checkoutsInitiated: number
  readonly byDay: ReadonlyMap<string, DailyAggregate>
}

export interface SpendAndMeta {
  readonly spend: SpendTotals
  readonly meta: MetaChannelTotals
}

const EMPTY_PERIOD: SpendAndMeta = {
  spend: { spendEur: 0, byDay: [] },
  meta: {
    spendEur: 0,
    revenueEur: 0,
    purchases: 0,
    impressions: 0,
    linkClicks: 0,
    checkoutsInitiated: 0,
    byDay: [],
  },
}

export async function fetchSpendBothPeriods(
  brandId: BrandId,
  current: DateRangeSelection,
  previous: DateRangeSelection,
  market: MarketSelection,
): Promise<{ current: SpendAndMeta; previous: SpendAndMeta }> {
  const targets = await resolveTargetAccounts(brandId, market)
  if (targets.length === 0) {
    return { current: EMPTY_PERIOD, previous: EMPTY_PERIOD }
  }

  const currentParams = toMetaInsightsParams(current)
  const previousParams = toMetaInsightsParams(previous)

  const [currentInsights, previousInsights] = await Promise.all([
    fetchAllInsights(targets, currentParams, true),
    fetchAllInsights(targets, previousParams, true),
  ])

  return {
    current: toSpendAndMeta(currentInsights),
    previous: toSpendAndMeta(previousInsights),
  }
}

async function resolveTargetAccounts(
  brandId: BrandId,
  market: MarketSelection,
): Promise<readonly AccountTarget[]> {
  const configured = getConfiguredBusinessManagersForBrand(brandId)
  if (configured.length === 0) {
    return []
  }
  const marketAllowed = marketAccountFilter(brandId, market)
  const perBm = await Promise.all(
    configured.map(async ({ businessManager, token }) => {
      const accounts = await fetchAdAccounts(token)
      const allowed = new Set(businessManager.accountIds)
      return accounts
        .filter((a) => allowed.has(a.id) && marketAllowed(a.id))
        .map((account) => ({ token, accountId: account.id, currency: account.currency }))
    }),
  )
  return perBm.flat()
}

function marketAccountFilter(
  brandId: BrandId,
  market: MarketSelection,
): (accountId: string) => boolean {
  if (market === 'ALL') {
    return () => true
  }
  const ids = new Set(getAdAccountIds(brandId, market))
  return (id) => ids.has(id)
}

async function fetchAllInsights(
  targets: readonly AccountTarget[],
  dateParams: Record<string, string>,
  daily: boolean,
): Promise<PeriodTotals> {
  const results = await Promise.all(
    targets.map((t) =>
      fetchAccountInsights(t.token, t.accountId, t.currency, dateParams, { daily })
        .then((data) => ({ currency: t.currency, totals: data.totals, daily: data.daily }))
        .catch(() => null),
    ),
  )

  const byDay = new Map<string, DailyAggregate>()
  let spendEur = 0
  let revenueEur = 0
  let purchases = 0
  let impressions = 0
  let linkClicks = 0
  let checkoutsInitiated = 0
  for (const entry of results) {
    if (!entry) {
      continue
    }
    spendEur += convertToEur(entry.totals.spend, entry.currency)
    revenueEur += convertToEur(entry.totals.revenue, entry.currency)
    purchases += entry.totals.purchases
    impressions += entry.totals.impressions
    linkClicks += entry.totals.linkClicks
    checkoutsInitiated += entry.totals.checkoutsInitiated
    for (const point of entry.daily) {
      const bucket = byDay.get(point.date) ?? {
        spendEur: 0,
        revenueEur: 0,
        purchases: 0,
        impressions: 0,
        linkClicks: 0,
        checkoutsInitiated: 0,
      }
      bucket.spendEur += convertToEur(point.spend, entry.currency)
      bucket.revenueEur += convertToEur(point.revenue, entry.currency)
      bucket.purchases += point.purchases
      bucket.impressions += point.impressions
      bucket.linkClicks += point.linkClicks
      bucket.checkoutsInitiated += point.checkoutsInitiated
      byDay.set(point.date, bucket)
    }
  }
  return {
    spendEur,
    revenueEur,
    purchases,
    impressions,
    linkClicks,
    checkoutsInitiated,
    byDay,
  }
}

function toSpendAndMeta(period: PeriodTotals): SpendAndMeta {
  const dailyEntries = Array.from(period.byDay.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  const spendByDay = dailyEntries.map(([date, agg]) => ({ date, spendEur: agg.spendEur }))
  const metaByDay: readonly MetaChannelDailyPoint[] = dailyEntries.map(([date, agg]) => ({
    date,
    spendEur: agg.spendEur,
    revenueEur: agg.revenueEur,
    purchases: agg.purchases,
    impressions: agg.impressions,
    linkClicks: agg.linkClicks,
    checkoutsInitiated: agg.checkoutsInitiated,
  }))
  return {
    spend: { spendEur: period.spendEur, byDay: spendByDay },
    meta: {
      spendEur: period.spendEur,
      revenueEur: period.revenueEur,
      purchases: period.purchases,
      impressions: period.impressions,
      linkClicks: period.linkClicks,
      checkoutsInitiated: period.checkoutsInitiated,
      byDay: metaByDay,
    },
  }
}

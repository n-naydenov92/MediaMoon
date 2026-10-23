import type { GoogleAdsCredentials } from '@/types/integrations'
import { fetchAccountInsights, type GoogleAdsAccountInsights } from '@/lib/gateways/GoogleAdsGateway'
import type { MarketSelection } from '@/lib/markets'
import { accountIdsForSelection, resolveGoogleAdsCredentials, type BrandContext } from '@/lib/tenancy'
import { rangeFromSelection, type DateRangeSelection } from '@/lib/meta/dateRange'
import { convertToEur } from '@/lib/meta/fx'
import type { GoogleAdsChannelTotals } from './aggregate'

export interface GoogleAdsPeriods {
  readonly current: GoogleAdsChannelTotals | null
  readonly previous: GoogleAdsChannelTotals | null
}

const EMPTY_PERIODS: GoogleAdsPeriods = { current: null, previous: null }

export async function fetchGoogleAdsBothPeriods(
  ctx: BrandContext,
  current: DateRangeSelection,
  previous: DateRangeSelection,
  market: MarketSelection,
): Promise<GoogleAdsPeriods> {
  const credentials = await resolveGoogleAdsCredentials()
  if (!credentials) {
    return EMPTY_PERIODS
  }
  const customerIds = accountIdsForSelection(ctx.googleAdsCustomers, market)
  if (customerIds.length === 0) {
    return EMPTY_PERIODS
  }
  const [currentTotals, previousTotals] = await Promise.all([
    fetchPeriodTotals(customerIds, current, credentials),
    fetchPeriodTotals(customerIds, previous, credentials),
  ])
  return { current: currentTotals, previous: previousTotals }
}

async function fetchPeriodTotals(
  customerIds: readonly string[],
  selection: DateRangeSelection,
  credentials: GoogleAdsCredentials,
): Promise<GoogleAdsChannelTotals> {
  const range = rangeFromSelection(selection)
  const results = await Promise.all(
    customerIds.map((customerId) =>
      fetchAccountInsights(customerId, range, credentials).catch(() => null)),
  )
  return aggregateTotals(results)
}

interface DailyAccumulator {
  spendEur: number
  revenueEur: number
  conversions: number
  clicks: number
}

function aggregateTotals(
  results: readonly (GoogleAdsAccountInsights | null)[],
): GoogleAdsChannelTotals {
  let spendEur = 0
  let revenueEur = 0
  let conversions = 0
  let impressions = 0
  let clicks = 0
  for (const result of results) {
    if (!result) {
      continue
    }
    spendEur += convertToEur(result.totals.spend, result.currencyCode)
    revenueEur += convertToEur(result.totals.revenue, result.currencyCode)
    conversions += result.totals.conversions
    impressions += result.totals.impressions
    clicks += result.totals.clicks
  }
  return { spendEur, revenueEur, conversions, impressions, clicks, byDay: mergeAccountsDaily(results) }
}

function mergeAccountsDaily(
  results: readonly (GoogleAdsAccountInsights | null)[],
): GoogleAdsChannelTotals['byDay'] {
  const dailyByDate = new Map<string, DailyAccumulator>()
  for (const result of results) {
    if (!result) {
      continue
    }
    for (const day of result.byDay) {
      const acc = dailyByDate.get(day.date)
        ?? { spendEur: 0, revenueEur: 0, conversions: 0, clicks: 0 }
      acc.spendEur += convertToEur(day.spend, result.currencyCode)
      acc.revenueEur += convertToEur(day.revenue, result.currencyCode)
      acc.conversions += day.conversions
      acc.clicks += day.clicks
      dailyByDate.set(day.date, acc)
    }
  }
  return Array.from(dailyByDate, ([date, acc]) => ({ date, ...acc }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

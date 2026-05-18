import type { BrandId } from '@/config/brands'
import {
  averageDailyBounceRate,
  averageDailyConversionRate,
  buildChannelsBreakdown,
  buildChannelsByDay,
  buildSpendBreakdown,
  combineKpis,
  computeDeltas,
  mergeDailyPoints,
  type AnalyticsTotalsForAggregate,
  type CommerceTotals,
} from '@/lib/dashboard/aggregate'
import { fetchAnalyticsForBrand } from '@/lib/dashboard/fetchAnalytics'
import { fetchCommerceForBrand } from '@/lib/dashboard/fetchCommerce'
import { fetchGoogleAdsBothPeriods } from '@/lib/dashboard/fetchGoogleAds'
import { fetchKlaviyoForBrand } from '@/lib/dashboard/fetchKlaviyo'
import { fetchSpendBothPeriods } from '@/lib/dashboard/fetchSpend'
import type { MarketSelection } from '@/lib/markets'
import type { DateRangeSelection } from '@/lib/meta/dateRange'
import type {
  DashboardAnalyticsData,
  DashboardKpis,
  DashboardSummary,
} from '@/types/dashboard'

export const CACHE_VERSION = 'v23'

export async function buildSummary(
  brandId: BrandId,
  current: DateRangeSelection,
  previous: DateRangeSelection,
  market: MarketSelection,
): Promise<DashboardSummary> {
  const [spend, googleAds, commercePeriods, analyticsPeriods, klaviyoCurrent, klaviyoPrevious] =
    await Promise.all([
      fetchSpendBothPeriods(brandId, current, previous, market),
      fetchGoogleAdsBothPeriods(brandId, current, previous, market),
      fetchCommerceBothPeriods(brandId, current, previous, market),
      fetchAnalyticsBothPeriods(brandId, current, previous, market),
      fetchKlaviyoForBrand(brandId, current),
      fetchKlaviyoForBrand(brandId, previous),
    ])
  const commerceCurrent = commercePeriods.current
  const commercePrevious = commercePeriods.previous
  const analyticsCurrent = analyticsPeriods.current
  const analyticsPrevious = analyticsPeriods.previous

  const commerceCurrentTotals = commerceCurrent?.totals ?? null
  const commercePreviousTotals = commercePrevious?.totals ?? null
  const analyticsCurrentForAgg = toAggregateAnalytics(analyticsCurrent)
  const analyticsPreviousForAgg = toAggregateAnalytics(analyticsPrevious)

  const kpis = buildPeriodKpis(
    spend.current.spend.spendEur + (googleAds.current?.spendEur ?? 0),
    commerceCurrentTotals,
    analyticsCurrentForAgg,
  )
  const previousKpis = buildPeriodKpis(
    spend.previous.spend.spendEur + (googleAds.previous?.spendEur ?? 0),
    commercePreviousTotals,
    analyticsPreviousForAgg,
  )
  const byDay = mergeDailyPoints({
    metaSpend: spend.current.spend.byDay,
    googleAdsSpend: googleAds.current?.byDay ?? [],
    commerce: commerceCurrentTotals?.byDay ?? null,
    analytics: analyticsCurrentForAgg?.byDay ?? null,
  })

  return {
    currency: 'EUR',
    kpis,
    previous: previousKpis,
    deltas: computeDeltas(kpis, previousKpis),
    byDay,
    topProducts: commerceCurrent?.topProducts ?? [],
    spendBreakdown: buildSpendBreakdown(spend.current.meta, googleAds.current),
    fetchedAt: Date.now(),
    hasCommerce: commerceCurrent !== null,
    hasAnalytics: analyticsCurrent !== null,
    channels: buildChannelsBreakdown(spend.current.meta, googleAds.current, klaviyoCurrent),
    previousChannels: buildChannelsBreakdown(
      spend.previous.meta,
      googleAds.previous,
      klaviyoPrevious,
    ),
    channelsByDay: buildChannelsByDay(spend.current.meta, googleAds.current),
    analytics: buildAnalytics(analyticsCurrent, kpis),
    previousAnalytics: buildAnalytics(analyticsPrevious, previousKpis),
    categories: commerceCurrent?.categories ?? [],
  }
}

export function buildCacheTag(
  brandId: string,
  market: MarketSelection,
  params: URLSearchParams,
): string {
  const from = params.get('from')
  const to = params.get('to')
  if (from && to) {
    return `dashboard:${CACHE_VERSION}:${brandId}:${market}:custom:${from}:${to}`
  }
  const preset = params.get('datePreset') ?? 'today'
  return `dashboard:${CACHE_VERSION}:${brandId}:${market}:${preset}`
}

function buildPeriodKpis(
  adSpendEur: number,
  commerce: CommerceTotals | null,
  analytics: AnalyticsTotalsForAggregate | null,
): DashboardKpis {
  const base = combineKpis(adSpendEur, commerce, analytics)
  const dailyAvgConversionRate = averageDailyConversionRate(commerce, analytics)
  return { ...base, conversionRate: dailyAvgConversionRate ?? base.conversionRate }
}

function buildAnalytics(
  analytics: Awaited<ReturnType<typeof fetchAnalyticsForBrand>>,
  kpis: DashboardKpis,
): DashboardAnalyticsData | undefined {
  if (!analytics) {
    return undefined
  }
  const dailyAvgBounce = averageDailyBounceRate({
    sessions: analytics.totals.sessions,
    activeUsers: analytics.totals.activeUsers,
    byDay: analytics.byDay,
  })
  return {
    kpis: {
      sessions: analytics.totals.sessions,
      activeUsers: analytics.totals.activeUsers,
      newUsers: analytics.totals.newUsers,
      firstTimePurchasers: analytics.totals.firstTimePurchasers,
      conversionRate: kpis.conversionRate,
      bounceRate: dailyAvgBounce ?? analytics.totals.bounceRate,
    },
    trafficSources: analytics.breakdowns.trafficSources,
    devices: analytics.breakdowns.devices,
    topLandingPages: analytics.breakdowns.topLandingPages,
    funnel: analytics.breakdowns.funnel,
    funnelByDay: analytics.breakdowns.funnelByDay,
  }
}

async function fetchCommerceBothPeriods(
  brandId: BrandId,
  current: DateRangeSelection,
  previous: DateRangeSelection,
  market: MarketSelection,
): Promise<{
  current: Awaited<ReturnType<typeof fetchCommerceForBrand>>
  previous: Awaited<ReturnType<typeof fetchCommerceForBrand>>
}> {
  const currentResult = await fetchCommerceForBrand(brandId, current, market)
  const previousResult = await fetchCommerceForBrand(brandId, previous, market)
  return { current: currentResult, previous: previousResult }
}

async function fetchAnalyticsBothPeriods(
  brandId: BrandId,
  current: DateRangeSelection,
  previous: DateRangeSelection,
  market: MarketSelection,
): Promise<{
  current: Awaited<ReturnType<typeof fetchAnalyticsForBrand>>
  previous: Awaited<ReturnType<typeof fetchAnalyticsForBrand>>
}> {
  const currentResult = await fetchAnalyticsForBrand(brandId, current, market)
  const previousResult = await fetchAnalyticsForBrand(brandId, previous, market)
  return { current: currentResult, previous: previousResult }
}

function toAggregateAnalytics(
  result: Awaited<ReturnType<typeof fetchAnalyticsForBrand>>,
): AnalyticsTotalsForAggregate | null {
  if (!result) {
    return null
  }
  return {
    sessions: result.totals.sessions,
    activeUsers: result.totals.activeUsers,
    byDay: result.byDay,
  }
}

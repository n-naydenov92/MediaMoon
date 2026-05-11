import type { AnalyticsProviderConfig } from '@/config/analyticsProviders'
import type { MarketSelection } from '@/lib/markets'
import { getClient } from './client'
import { buildCountryFilter, composeAnd, eventInListFilter } from './filters'
import {
  mapDailyRows,
  mapDevices,
  mapFunnel,
  mapFunnelByDay,
  mapTopLandingPages,
  mapTotalsRow,
  mapTrafficSources,
} from './mappers'
import type { AnalyticsRangeResult } from './types'

export type {
  AnalyticsBreakdowns,
  AnalyticsDailyPoint,
  AnalyticsRangeResult,
  AnalyticsTotals,
} from './types'

const TOP_LANDING_PAGES_LIMIT = 10

export async function fetchAnalyticsRange(
  config: AnalyticsProviderConfig,
  dateMin: string,
  dateMax: string,
  market: MarketSelection,
): Promise<AnalyticsRangeResult> {
  const client = getClient()
  const property = `properties/${config.propertyId}`
  const dateRange = { startDate: dateMin, endDate: dateMax }
  const countryFilter = buildCountryFilter(market)
  const funnelOverviewFilter = composeAnd(
    eventInListFilter(['view_item', 'add_to_cart', 'begin_checkout', 'purchase']),
    countryFilter,
  )
  const funnelDailyFilter = composeAnd(
    eventInListFilter(['add_to_cart', 'purchase']),
    countryFilter,
  )

  const [
    byDayResp,
    totalsResp,
    sourcesResp,
    devicesResp,
    pagesResp,
    funnelResp,
    funnelDailyResp,
  ] = await Promise.all([
    client.runReport({
      property,
      dateRanges: [dateRange],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'newUsers' },
        { name: 'firstTimePurchasers' },
        { name: 'bounceRate' },
      ],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
      dimensionFilter: countryFilter,
    }),
    client.runReport({
      property,
      dateRanges: [dateRange],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'newUsers' },
        { name: 'firstTimePurchasers' },
        { name: 'bounceRate' },
      ],
      dimensionFilter: countryFilter,
    }),
    client.runReport({
      property,
      dateRanges: [dateRange],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'activeUsers' }, { name: 'purchaseRevenue' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      dimensionFilter: countryFilter,
    }),
    client.runReport({
      property,
      dateRanges: [dateRange],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      dimensionFilter: countryFilter,
    }),
    client.runReport({
      property,
      dateRanges: [dateRange],
      dimensions: [{ name: 'landingPage' }],
      metrics: [{ name: 'activeUsers' }, { name: 'transactions' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: TOP_LANDING_PAGES_LIMIT,
      dimensionFilter: countryFilter,
    }),
    client.runReport({
      property,
      dateRanges: [dateRange],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'activeUsers' }],
      dimensionFilter: funnelOverviewFilter,
    }),
    client.runReport({
      property,
      dateRanges: [dateRange],
      dimensions: [{ name: 'date' }, { name: 'eventName' }],
      metrics: [{ name: 'activeUsers' }],
      dimensionFilter: funnelDailyFilter,
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    }),
  ])

  const byDay = mapDailyRows(byDayResp[0].rows ?? [])
  const totals = mapTotalsRow(totalsResp[0].rows ?? [])
  const trafficSources = mapTrafficSources(sourcesResp[0].rows ?? [])
  const devices = mapDevices(devicesResp[0].rows ?? [])
  const topLandingPages = mapTopLandingPages(pagesResp[0].rows ?? [])
  const funnel = mapFunnel(funnelResp[0].rows ?? [], totals.activeUsers)
  const funnelByDay = mapFunnelByDay(funnelDailyResp[0].rows ?? [])

  return {
    totals,
    byDay,
    breakdowns: { trafficSources, devices, topLandingPages, funnel, funnelByDay },
  }
}

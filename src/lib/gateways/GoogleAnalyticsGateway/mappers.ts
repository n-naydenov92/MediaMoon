import type {
  DeviceBreakdownPoint,
  FunnelDailyPoint,
  FunnelStage,
  TopLandingPage,
  TrafficSourcePoint,
} from '@/types/dashboard'
import {
  formatGaDate,
  parseDevice,
  parseFloatSafe,
  parseInteger,
  parseRatio,
} from './parse'
import type { AnalyticsDailyPoint, AnalyticsTotals, ReportRow } from './types'

export function mapDailyRows(rows: readonly ReportRow[]): readonly AnalyticsDailyPoint[] {
  return rows
    .map(toDailyPoint)
    .filter((p): p is AnalyticsDailyPoint => p !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
}

function toDailyPoint(row: ReportRow): AnalyticsDailyPoint | null {
  const date = formatGaDate(row.dimensionValues?.[0]?.value)
  if (!date) {
    return null
  }
  return {
    date,
    sessions: parseInteger(row.metricValues?.[0]?.value),
    activeUsers: parseInteger(row.metricValues?.[1]?.value),
    newUsers: parseInteger(row.metricValues?.[2]?.value),
    firstTimePurchasers: parseInteger(row.metricValues?.[3]?.value),
    bounceRate: parseRatio(row.metricValues?.[4]?.value),
  }
}

export function mapTotalsRow(rows: readonly ReportRow[]): AnalyticsTotals {
  const row = rows[0]
  if (!row) {
    return {
      sessions: 0,
      activeUsers: 0,
      newUsers: 0,
      firstTimePurchasers: 0,
      bounceRate: null,
    }
  }
  return {
    sessions: parseInteger(row.metricValues?.[0]?.value),
    activeUsers: parseInteger(row.metricValues?.[1]?.value),
    newUsers: parseInteger(row.metricValues?.[2]?.value),
    firstTimePurchasers: parseInteger(row.metricValues?.[3]?.value),
    bounceRate: parseRatio(row.metricValues?.[4]?.value),
  }
}

export function mapTrafficSources(rows: readonly ReportRow[]): readonly TrafficSourcePoint[] {
  const raw = rows
    .map<TrafficSourcePoint | null>((row) => {
      const source = row.dimensionValues?.[0]?.value
      if (!source) {
        return null
      }
      return {
        source,
        activeUsers: parseInteger(row.metricValues?.[0]?.value),
        userShare: 0,
        revenue: parseFloatSafe(row.metricValues?.[1]?.value),
        revenueShare: 0,
      }
    })
    .filter((p): p is TrafficSourcePoint => p !== null)
  const totalUsers = raw.reduce((acc, p) => acc + p.activeUsers, 0)
  const totalRevenue = raw.reduce((acc, p) => acc + p.revenue, 0)
  return raw.map((p) => ({
    ...p,
    userShare: totalUsers > 0 ? p.activeUsers / totalUsers : 0,
    revenueShare: totalRevenue > 0 ? p.revenue / totalRevenue : 0,
  }))
}

export function mapDevices(rows: readonly ReportRow[]): readonly DeviceBreakdownPoint[] {
  const points = rows
    .map<DeviceBreakdownPoint | null>((row) => {
      const device = parseDevice(row.dimensionValues?.[0]?.value)
      if (!device) {
        return null
      }
      return {
        device,
        sessions: parseInteger(row.metricValues?.[0]?.value),
        share: 0,
      }
    })
    .filter((p): p is DeviceBreakdownPoint => p !== null)
  return withShare(points, (p) => p.sessions)
}

export function mapFunnel(
  rows: readonly ReportRow[],
  totalActiveUsers: number,
): readonly FunnelStage[] {
  const byEvent = new Map<string, number>()
  for (const row of rows) {
    const eventName = row.dimensionValues?.[0]?.value
    if (!eventName) {
      continue
    }
    byEvent.set(eventName, parseInteger(row.metricValues?.[0]?.value))
  }
  const home = totalActiveUsers
  const product = byEvent.get('view_item') ?? 0
  const cart = byEvent.get('add_to_cart') ?? 0
  const checkout = byEvent.get('begin_checkout') ?? 0
  const purchase = byEvent.get('purchase') ?? 0
  return [
    { key: 'homePage', label: 'Home Page', activeUsers: home, stageConversion: 1 },
    {
      key: 'productPage',
      label: 'Product Page',
      activeUsers: product,
      stageConversion: home > 0 ? product / home : 0,
    },
    {
      key: 'addToCart',
      label: 'Add to Cart',
      activeUsers: cart,
      stageConversion: product > 0 ? cart / product : 0,
    },
    {
      key: 'initiateCheckout',
      label: 'Initiate Checkout',
      activeUsers: checkout,
      stageConversion: cart > 0 ? checkout / cart : 0,
    },
    {
      key: 'purchase',
      label: 'Purchase',
      activeUsers: purchase,
      stageConversion: checkout > 0 ? purchase / checkout : 0,
    },
  ]
}

export function mapFunnelByDay(rows: readonly ReportRow[]): readonly FunnelDailyPoint[] {
  const byDate = new Map<string, { addToCartUsers: number; purchaseUsers: number }>()
  for (const row of rows) {
    const date = formatGaDate(row.dimensionValues?.[0]?.value)
    const eventName = row.dimensionValues?.[1]?.value
    if (!date || !eventName) {
      continue
    }
    const users = parseInteger(row.metricValues?.[0]?.value)
    const bucket = byDate.get(date) ?? { addToCartUsers: 0, purchaseUsers: 0 }
    if (eventName === 'add_to_cart') {
      bucket.addToCartUsers += users
    } else if (eventName === 'purchase') {
      bucket.purchaseUsers += users
    }
    byDate.set(date, bucket)
  }
  return Array.from(byDate.entries())
    .map(([date, agg]) => ({ date, ...agg }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function mapTopLandingPages(rows: readonly ReportRow[]): readonly TopLandingPage[] {
  return rows
    .map<TopLandingPage | null>((row) => {
      const path = row.dimensionValues?.[0]?.value
      if (!path) {
        return null
      }
      const activeUsers = parseInteger(row.metricValues?.[0]?.value)
      const conversions = parseInteger(row.metricValues?.[1]?.value)
      const conversionRate = activeUsers > 0 ? conversions / activeUsers : 0
      return { path, activeUsers, conversions, conversionRate }
    })
    .filter((p): p is TopLandingPage => p !== null)
}

function withShare<T extends { readonly sessions: number; readonly share: number }>(
  points: readonly T[],
  pick: (p: T) => number,
): readonly T[] {
  const total = points.reduce((acc, p) => acc + pick(p), 0)
  if (total === 0) {
    return points
  }
  return points.map((p) => ({ ...p, share: pick(p) / total }))
}

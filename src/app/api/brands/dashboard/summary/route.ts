import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isBrandId, type BrandId } from '@/config/brands'
import {
  combineKpis,
  computeDeltas,
  mergeDailyPoints,
  type AnalyticsTotalsForAggregate,
} from '@/lib/dashboard/aggregate'
import { fetchAnalyticsForBrand } from '@/lib/dashboard/fetchAnalytics'
import {
  fetchCommerceForBrand,
  fetchTopProductsForBrand,
} from '@/lib/dashboard/fetchCommerce'
import { fetchSpendBothPeriods } from '@/lib/dashboard/fetchSpend'
import {
  parseDateRangeFromQuery,
  previousPeriod,
  type DateRangeSelection,
} from '@/lib/meta/dateRange'
import type { DashboardSummary } from '@/types/dashboard'

const CACHE_TTL_MS = 300_000
const UPSTREAM_ERROR_STATUS = 502

interface CacheEntry {
  readonly data: DashboardSummary
  readonly expiresAt: number
}

const globalForCache = globalThis as unknown as {
  __dashboardCache?: Map<string, CacheEntry>
}

if (!globalForCache.__dashboardCache) {
  globalForCache.__dashboardCache = new Map<string, CacheEntry>()
}
const cache = globalForCache.__dashboardCache

export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = request.nextUrl.searchParams
  const brandIdRaw = params.get('brandId')
  if (!brandIdRaw || !isBrandId(brandIdRaw)) {
    return NextResponse.json(
      { error: 'brandId query param is required or unknown' },
      { status: 400 },
    )
  }

  const tag = buildCacheTag(brandIdRaw, params)
  const isRefresh = params.get('refresh') === 'true'
  const cached = isRefresh ? null : readCache(tag)
  if (cached) {
    return NextResponse.json(cached)
  }

  const dateSelection = parseDateRangeFromQuery(params)
  const previousSelection = previousPeriod(dateSelection)

  try {
    const summary = await buildSummary(brandIdRaw, dateSelection, previousSelection)
    cache.set(tag, { data: summary, expiresAt: Date.now() + CACHE_TTL_MS })
    return NextResponse.json(summary)
  } catch (err) {
    console.error('[dashboard/summary] failed', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: UPSTREAM_ERROR_STATUS })
  }
}

function readCache(tag: string): DashboardSummary | null {
  const entry = cache.get(tag)
  if (!entry || Date.now() >= entry.expiresAt) {
    return null
  }
  return entry.data
}

async function buildSummary(
  brandId: BrandId,
  current: DateRangeSelection,
  previous: DateRangeSelection,
): Promise<DashboardSummary> {
  const [spend, commerceCurrent, commercePrevious, topProducts, analyticsCurrent, analyticsPrevious] =
    await Promise.all([
      fetchSpendBothPeriods(brandId, current, previous),
      fetchCommerceForBrand(brandId, current),
      fetchCommerceForBrand(brandId, previous),
      fetchTopProductsForBrand(brandId, current),
      fetchAnalyticsForBrand(brandId, current),
      fetchAnalyticsForBrand(brandId, previous),
    ])

  const analyticsCurrentForAgg = toAggregateAnalytics(analyticsCurrent)
  const analyticsPreviousForAgg = toAggregateAnalytics(analyticsPrevious)

  const kpis = combineKpis(spend.current, commerceCurrent, analyticsCurrentForAgg)
  const previousKpis = combineKpis(spend.previous, commercePrevious, analyticsPreviousForAgg)
  const byDay = mergeDailyPoints(
    spend.current.byDay,
    commerceCurrent?.byDay ?? null,
    analyticsCurrentForAgg?.byDay ?? null,
  )

  return {
    currency: 'EUR',
    kpis,
    previous: previousKpis,
    deltas: computeDeltas(kpis, previousKpis),
    byDay,
    topProducts,
    fetchedAt: Date.now(),
    hasCommerce: commerceCurrent !== null,
    hasAnalytics: analyticsCurrent !== null,
  }
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

function buildCacheTag(brandId: string, params: URLSearchParams): string {
  const from = params.get('from')
  const to = params.get('to')
  if (from && to) {
    return `dashboard:${brandId}:custom:${from}:${to}`
  }
  const preset = params.get('datePreset') ?? 'today'
  return `dashboard:${brandId}:${preset}`
}

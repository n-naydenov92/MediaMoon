import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { findBrandById, isBrandId } from '@/config/brands'
import { parseMarketSelection } from '@/lib/markets'
import { parseDateRangeFromQuery, previousPeriod } from '@/lib/meta/dateRange'
import type { DashboardSummary } from '@/types/dashboard'
import { buildCacheTag, buildSummary } from './helpers'

const CACHE_TTL_MS = 3_600_000
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
  const brand = findBrandById(brandIdRaw)
  if (!brand) {
    return NextResponse.json({ error: 'unknown brand' }, { status: 400 })
  }
  const market = parseMarketSelection(params.get('market') ?? undefined, brand.markets)

  const tag = buildCacheTag(brandIdRaw, market, params)
  const isRefresh = params.get('refresh') === 'true'
  const cached = isRefresh ? null : readCache(tag)
  if (cached) {
    return NextResponse.json(cached)
  }

  const dateSelection = parseDateRangeFromQuery(params)
  const previousSelection = previousPeriod(dateSelection)

  try {
    const summary = await buildSummary(brandIdRaw, dateSelection, previousSelection, market)
    cache.set(tag, { data: summary, expiresAt: Date.now() + CACHE_TTL_MS })
    return NextResponse.json(summary)
  } catch (err) {
    // eslint-disable-next-line no-console -- intentional logging
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

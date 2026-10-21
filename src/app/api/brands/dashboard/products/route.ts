import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { findBrandById, isBrandId } from '@/config/brands'
import { fetchCommerceProductsForBrand } from '@/lib/dashboard/fetchCommerce'
import { parseMarketSelection } from '@/lib/markets'
import { parseDateRangeFromQuery } from '@/lib/meta/dateRange'
import type { DashboardProducts } from '@/types/dashboard'
import { buildCacheTag } from '../summary/helpers'

const CACHE_TTL_MS = 3_600_000
const UPSTREAM_ERROR_STATUS = 502
const CACHE_TAG_PREFIX = 'products'

interface CacheEntry {
  readonly data: DashboardProducts
  readonly expiresAt: number
}

const globalForCache = globalThis as unknown as {
  __dashboardProductsCache?: Map<string, CacheEntry>
}

if (!globalForCache.__dashboardProductsCache) {
  globalForCache.__dashboardProductsCache = new Map<string, CacheEntry>()
}
const cache = globalForCache.__dashboardProductsCache

// Split from /summary: for Shopify brands top products and categories need every order's
// line items — the slow part — so the page shows KPIs and charts first and fills this in after.
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

  const tag = `${CACHE_TAG_PREFIX}:${buildCacheTag(brandIdRaw, market, params)}`
  const isRefresh = params.get('refresh') === 'true'
  const cached = isRefresh ? null : readCache(tag)
  if (cached) {
    return NextResponse.json(cached)
  }

  try {
    const result = await fetchCommerceProductsForBrand(brandIdRaw, parseDateRangeFromQuery(params), market)
    const products: DashboardProducts = result
      ? { hasCommerce: true, ...result }
      : { hasCommerce: false, topProducts: [], categories: [] }
    cache.set(tag, { data: products, expiresAt: Date.now() + CACHE_TTL_MS })
    return NextResponse.json(products)
  } catch (err) {
    // eslint-disable-next-line no-console -- intentional logging
    console.error('[dashboard/products] failed', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: UPSTREAM_ERROR_STATUS })
  }
}

function readCache(tag: string): DashboardProducts | null {
  const entry = cache.get(tag)
  if (!entry || Date.now() >= entry.expiresAt) {
    return null
  }
  return entry.data
}

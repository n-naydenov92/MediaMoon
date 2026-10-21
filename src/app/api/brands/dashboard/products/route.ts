import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { findBrandById, isBrandId } from '@/config/brands'
import { fetchCommerceProductsForBrand } from '@/lib/dashboard/fetchCommerce'
import { parseMarketSelection } from '@/lib/markets'
import { parseDateRangeFromQuery } from '@/lib/meta/dateRange'
import type { DashboardProducts } from '@/types/dashboard'

const UPSTREAM_ERROR_STATUS = 502

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

  try {
    const result = await fetchCommerceProductsForBrand(brandIdRaw, parseDateRangeFromQuery(params), market)
    const products: DashboardProducts = result
      ? { hasCommerce: true, ...result }
      : { hasCommerce: false, topProducts: [], categories: [] }
    return NextResponse.json(products)
  } catch (err) {
    // eslint-disable-next-line no-console -- intentional logging
    console.error('[dashboard/products] failed', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: UPSTREAM_ERROR_STATUS })
  }
}

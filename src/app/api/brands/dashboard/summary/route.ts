import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { findBrandById, isBrandId } from '@/config/brands'
import { parseMarketSelection } from '@/lib/markets'
import { parseDateRangeFromQuery, previousPeriod } from '@/lib/meta/dateRange'
import { metaErrorResponse } from '@/lib/meta/metaErrorResponse'
import { buildSummary } from './helpers'

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

  const dateSelection = parseDateRangeFromQuery(params)
  const previousSelection = previousPeriod(dateSelection)

  try {
    const summary = await buildSummary(brandIdRaw, dateSelection, previousSelection, market)
    return NextResponse.json(summary)
  } catch (err) {
    // eslint-disable-next-line no-console -- intentional logging
    console.error('[dashboard/summary] failed', err)
    return metaErrorResponse(err)
  }
}

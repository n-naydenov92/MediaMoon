import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { parseMarketSelection } from '@/lib/markets'
import { getBrandContext } from '@/lib/tenancy'
import { parseDateRangeFromQuery, previousPeriod } from '@/lib/meta/dateRange'
import { metaErrorResponse } from '@/lib/meta/metaErrorResponse'
import { buildSummary } from './helpers'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = request.nextUrl.searchParams
  const brandIdRaw = params.get('brandId')
  const ctx = brandIdRaw ? await getBrandContext(brandIdRaw) : null
  if (!ctx) {
    return NextResponse.json(
      { error: 'brandId query param is required or unknown' },
      { status: 400 },
    )
  }
  const market = parseMarketSelection(params.get('market') ?? undefined, ctx.brand.markets)

  const dateSelection = parseDateRangeFromQuery(params)
  const previousSelection = previousPeriod(dateSelection)

  try {
    const summary = await buildSummary(ctx, dateSelection, previousSelection, market)
    return NextResponse.json(summary)
  } catch (err) {
    // eslint-disable-next-line no-console -- intentional logging
    console.error('[dashboard/summary] failed', err)
    return metaErrorResponse(err)
  }
}

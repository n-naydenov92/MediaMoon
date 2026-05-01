import { NextResponse, type NextRequest } from 'next/server'
import { buildCacheKey, invalidate } from '@/lib/cache'
import { getNewsForBrandMarket } from '@/lib/pipeline'
import { isValidationError, validateBrandMarket } from '@/Section/trending-news/api/validators'

interface RefreshBody {
  readonly brandId?: unknown
  readonly market?: unknown
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json().catch(() => ({}))) as RefreshBody
  const result = validateBrandMarket(body.brandId, body.market)
  if (isValidationError(result)) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  invalidate(buildCacheKey(result.topic.brandId, result.market))
  try {
    const fresh = await getNewsForBrandMarket({
      topic: result.topic,
      market: result.market,
      includeSearchApi: true,
    })
    return NextResponse.json(fresh)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

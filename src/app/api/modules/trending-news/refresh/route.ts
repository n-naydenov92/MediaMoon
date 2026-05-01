import { NextResponse, type NextRequest } from 'next/server'
import type { Market } from '@/types'
import { buildCacheKey, invalidate } from '@/lib/cache'
import { findBrandTopic } from '@/Section/trending-news/config'
import { getNewsForBrandMarket } from '@/lib/pipeline'

const VALID_MARKETS: readonly Market[] = ['BG', 'ES', 'WORLD']

interface RefreshBody {
  readonly brandId?: unknown
  readonly market?: unknown
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json().catch(() => ({}))) as RefreshBody
  const brandId = typeof body.brandId === 'string' ? body.brandId : null
  const marketRaw = typeof body.market === 'string' ? body.market : null

  const topic = brandId ? findBrandTopic(brandId) : null
  if (!topic) {
    return NextResponse.json({ error: 'Invalid brand' }, { status: 400 })
  }
  const market = VALID_MARKETS.find((m) => m === marketRaw)
  if (!market || !topic.markets.includes(market)) {
    return NextResponse.json({ error: 'Invalid market' }, { status: 400 })
  }

  invalidate(buildCacheKey(topic.brandId, market))
  try {
    const fresh = await getNewsForBrandMarket({ topic, market, includeSearchApi: true })
    return NextResponse.json(fresh)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

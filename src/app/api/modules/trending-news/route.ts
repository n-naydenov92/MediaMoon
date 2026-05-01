import { NextResponse, type NextRequest } from 'next/server'
import type { Market } from '@/types'
import { findBrandTopic } from '@/Section/trending-news/config'
import { getNewsForBrandMarket } from '@/lib/pipeline'

const VALID_MARKETS: readonly Market[] = ['BG', 'ES', 'WORLD']

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const brandId = searchParams.get('brandId')
  const marketRaw = searchParams.get('market')

  const topic = brandId ? findBrandTopic(brandId) : null
  if (!topic) {
    return NextResponse.json({ error: 'Unknown brand' }, { status: 400 })
  }

  const market = parseMarket(marketRaw)
  if (!market) {
    return NextResponse.json({ error: 'Invalid market' }, { status: 400 })
  }
  if (!topic.markets.includes(market)) {
    return NextResponse.json({ error: 'Market not supported for this brand' }, { status: 400 })
  }

  try {
    const result = await getNewsForBrandMarket({ topic, market })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function parseMarket(value: string | null): Market | null {
  if (!value) {
    return null
  }
  return VALID_MARKETS.find((m) => m === value) ?? null
}

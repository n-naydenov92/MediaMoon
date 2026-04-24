import { NextResponse, type NextRequest } from 'next/server'
import type { Market } from '@/types'
import { buildCacheKey, invalidate } from '@/lib/cache'
import { findTabById, isTopicTab } from '@/Section/trending-news/config'
import { getNewsForTabMarket } from '@/lib/pipeline'

const VALID_MARKETS: readonly Market[] = ['BG', 'ES', 'WORLD']

interface RefreshBody {
  readonly tabId?: unknown
  readonly market?: unknown
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json().catch(() => ({}))) as RefreshBody
  const tabId = typeof body.tabId === 'string' ? body.tabId : null
  const marketRaw = typeof body.market === 'string' ? body.market : null

  const tab = tabId ? findTabById(tabId) : null
  if (!tab || !isTopicTab(tab)) {
    return NextResponse.json({ error: 'Invalid tab' }, { status: 400 })
  }
  const market = VALID_MARKETS.find((m) => m === marketRaw)
  if (!market || !tab.markets.includes(market)) {
    return NextResponse.json({ error: 'Invalid market' }, { status: 400 })
  }

  invalidate(buildCacheKey(tab.id, market))
  try {
    const fresh = await getNewsForTabMarket({ tab, market, includeSearchApi: true })
    return NextResponse.json(fresh)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

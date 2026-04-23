import { NextResponse, type NextRequest } from 'next/server'
import type { Market } from '@/types'
import { findTabById, isTopicTab } from '@/Section/trending-news/config'
import { getNewsForTabMarket } from '@/lib/pipeline'

const VALID_MARKETS: readonly Market[] = ['BG', 'ES', 'WORLD']

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const tabId = searchParams.get('tabId')
  const marketRaw = searchParams.get('market')

  const tab = tabId ? findTabById(tabId) : null
  if (!tab) {
    return NextResponse.json({ error: 'Unknown tab' }, { status: 400 })
  }
  if (!isTopicTab(tab)) {
    return NextResponse.json({ error: 'Overview tab has no direct feed' }, { status: 400 })
  }

  const market = parseMarket(marketRaw)
  if (!market) {
    return NextResponse.json({ error: 'Invalid market' }, { status: 400 })
  }
  if (!tab.markets.includes(market)) {
    return NextResponse.json({ error: 'Market not supported for this tab' }, { status: 400 })
  }

  try {
    const result = await getNewsForTabMarket({ tab, market })
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

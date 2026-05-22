import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { fetchAdSets, type StatusFilter } from '@/lib/gateways/MetaAdsGateway'
import { resolveAccountTokenFromRequest } from '@/lib/meta/resolveBrandToken'

function parseStatus(raw: string | null): StatusFilter {
  if (raw === 'active' || raw === 'paused') return raw
  return 'all'
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const resolved = resolveAccountTokenFromRequest(request)
  if (!resolved.ok) return resolved.response

  const campaignId = request.nextUrl.searchParams.get('campaignId')
  if (typeof campaignId !== 'string' || !campaignId) {
    return NextResponse.json({ error: 'campaignId query param is required' }, { status: 400 })
  }

  const status = parseStatus(request.nextUrl.searchParams.get('status'))

  try {
    const adSets = await fetchAdSets(resolved.token, campaignId, status)
    return NextResponse.json({ adSets })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

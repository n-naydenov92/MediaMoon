import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { fetchCampaigns, type StatusFilter } from '@/lib/gateways/MetaAdsGateway'
import { resolveAccountTokenFromRequest } from '@/lib/meta/resolveBrandToken'

function parseStatus(raw: string | null): StatusFilter {
  if (raw === 'active' || raw === 'paused') return raw
  return 'all'
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const resolved = resolveAccountTokenFromRequest(request)
  if (!resolved.ok) return resolved.response

  const status = parseStatus(request.nextUrl.searchParams.get('status'))

  try {
    const campaigns = await fetchCampaigns(resolved.token, resolved.accountId, status)
    return NextResponse.json({ campaigns })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

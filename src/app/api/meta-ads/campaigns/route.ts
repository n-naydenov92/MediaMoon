import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { fetchCampaigns } from '@/lib/gateways/MetaAdsGateway'
import { resolveAccountTokenFromRequest } from '@/lib/meta/resolveBrandToken'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const resolved = resolveAccountTokenFromRequest(request)
  if (!resolved.ok) return resolved.response

  try {
    const campaigns = await fetchCampaigns(resolved.token, resolved.accountId)
    return NextResponse.json({ campaigns })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

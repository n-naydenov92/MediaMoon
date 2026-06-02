import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { fetchDsaEntities } from '@/lib/gateways/MetaAdsGateway'
import { resolveAccountTokenFromRequest } from '@/lib/meta/resolveBrandToken'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const resolved = resolveAccountTokenFromRequest(request)
  if (!resolved.ok) return resolved.response

  try {
    const dsaEntities = await fetchDsaEntities(resolved.token, resolved.accountId)
    return NextResponse.json({ dsaEntities })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

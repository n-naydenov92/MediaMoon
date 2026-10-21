import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { fetchMetaUsage } from '@/lib/gateways/MetaAdsGateway'
import { metaErrorResponse } from '@/lib/meta/metaErrorResponse'
import { resolveAccountTokenFromRequest } from '@/lib/meta/resolveBrandToken'

// Debug view of Meta's rate-limit counters for one ad account. Requested only when someone
// opens the limits dialog or presses its Refresh — never polled.
export async function GET(request: NextRequest): Promise<NextResponse> {
  const resolved = resolveAccountTokenFromRequest(request)
  if (!resolved.ok) return resolved.response

  try {
    const usage = await fetchMetaUsage(resolved.token, resolved.accountId)
    return NextResponse.json({ usage, measuredAt: Date.now() })
  } catch (err) {
    return metaErrorResponse(err)
  }
}

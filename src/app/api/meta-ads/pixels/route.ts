import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { fetchPixels } from '@/lib/gateways/MetaAdsGateway'
import { metaErrorResponse } from '@/lib/meta/metaErrorResponse'
import { resolveAccountTokenFromRequest } from '@/lib/meta/resolveBrandToken'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(request: NextRequest): Promise<NextResponse> {
  const resolved = await resolveAccountTokenFromRequest(request)
  if (!resolved.ok) return resolved.response

  try {
    const pixels = await fetchPixels(resolved.token, resolved.accountId)
    return NextResponse.json({ result: pixels })
  } catch (err) {
    return metaErrorResponse(err)
  }
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { fetchPixels } from '@/lib/gateways/MetaAdsGateway'
import { resolveAccountTokenFromRequest } from '@/lib/meta/resolveBrandToken'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(request: NextRequest): Promise<NextResponse> {
  const resolved = resolveAccountTokenFromRequest(request)
  if (!resolved.ok) return resolved.response

  try {
    const pixels = await fetchPixels(resolved.token, resolved.accountId)
    return NextResponse.json({ result: pixels })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

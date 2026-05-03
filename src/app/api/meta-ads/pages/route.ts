import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { fetchPages } from '@/lib/gateways/MetaAdsGateway'
import { resolveBrandTokenFromRequest } from '@/lib/meta/resolveBrandToken'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const resolved = resolveBrandTokenFromRequest(request)
  if (!resolved.ok) return resolved.response

  try {
    const pages = await fetchPages(resolved.token)
    return NextResponse.json({ pages })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

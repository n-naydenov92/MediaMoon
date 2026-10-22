import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { fetchAdSet } from '@/lib/gateways/MetaAdsGateway'
import { metaErrorResponse } from '@/lib/meta/metaErrorResponse'
import { resolveAccountTokenFromRequest } from '@/lib/meta/resolveBrandToken'

export const runtime = 'nodejs'
export const maxDuration = 30

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>
}

export async function GET(request: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  const resolved = await resolveAccountTokenFromRequest(request)
  if (!resolved.ok) return resolved.response

  const { id } = await ctx.params
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  try {
    const detail = await fetchAdSet(resolved.token, id)
    return NextResponse.json({ result: detail })
  } catch (err) {
    return metaErrorResponse(err)
  }
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { fetchInstagramAccountsForPage } from '@/lib/gateways/MetaAdsGateway'
import { metaErrorResponse } from '@/lib/meta/metaErrorResponse'
import { resolveAccountTokenFromRequest } from '@/lib/meta/resolveBrandToken'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const resolved = await resolveAccountTokenFromRequest(request)
  if (!resolved.ok) return resolved.response

  const pageId = request.nextUrl.searchParams.get('pageId')
  if (!pageId) {
    return NextResponse.json({ error: 'pageId query param is required' }, { status: 400 })
  }

  try {
    const instagramAccounts = await fetchInstagramAccountsForPage(resolved.token, pageId)
    return NextResponse.json({ instagramAccounts })
  } catch (err) {
    return metaErrorResponse(err)
  }
}

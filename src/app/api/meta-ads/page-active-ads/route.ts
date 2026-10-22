import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { countActiveAdsForPage } from '@/lib/gateways/MetaAdsGateway'
import { metaErrorResponse } from '@/lib/meta/metaErrorResponse'
import { resolveBrandTokenFromRequest } from '@/lib/meta/resolveBrandToken'
import { adsVolumeAccountId, parsePageIds } from './helpers'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const resolved = await resolveBrandTokenFromRequest(request)
  if (!resolved.ok) return resolved.response

  const accountId = await adsVolumeAccountId(resolved.brandId)
  if (!accountId) {
    return NextResponse.json({ error: `No ad account configured for brand "${resolved.brandId}"` }, { status: 503 })
  }

  const pageIds = parsePageIds(request.nextUrl.searchParams.get('pageIds'))
  if (pageIds.length === 0) {
    return NextResponse.json({ error: 'pageIds query param is required' }, { status: 400 })
  }

  try {
    const counts = await Promise.all(
      pageIds.map((pageId) => countActiveAdsForPage(resolved.token, accountId, pageId)),
    )
    const activeAdsByPageId = Object.fromEntries(pageIds.map((pageId, i) => [pageId, counts[i]]))
    return NextResponse.json({ activeAdsByPageId })
  } catch (err) {
    return metaErrorResponse(err)
  }
}

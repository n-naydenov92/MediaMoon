import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { fetchAdPreview } from '@/lib/gateways/MetaAdsGateway'
import { metaErrorResponse } from '@/lib/meta/metaErrorResponse'
import {
  resolveAccountTokenFromRequest,
  resolveBrandTokenFromRequest,
} from '@/lib/meta/resolveBrandToken'

const DEFAULT_DATE_PRESET = 'today'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const accountIdParam = request.nextUrl.searchParams.get('accountId')
  const resolved = accountIdParam
    ? resolveAccountTokenFromRequest(request)
    : resolveBrandTokenFromRequest(request)
  if (!resolved.ok) return resolved.response

  const adId = request.nextUrl.searchParams.get('adId')
  if (!adId) {
    return NextResponse.json({ error: 'adId required' }, { status: 400 })
  }

  const datePreset = request.nextUrl.searchParams.get('datePreset') ?? DEFAULT_DATE_PRESET

  try {
    const preview = await fetchAdPreview(resolved.token, adId, datePreset)
    return NextResponse.json({
      ad: preview.ad,
      post_preview: preview.postPreview,
      video_url: preview.videoUrl,
      video_thumbnail: preview.videoThumbnail,
      insights: preview.insights,
      insights_error: preview.insightsError,
    })
  } catch (err) {
    return metaErrorResponse(err)
  }
}

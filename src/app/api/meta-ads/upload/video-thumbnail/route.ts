import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { fetchVideoThumbnailState } from '@/lib/gateways/MetaAdsGateway'
import { copyImageToAccount } from '@/lib/meta/copyImageToAccount'
import { metaErrorResponse } from '@/lib/meta/metaErrorResponse'
import { resolveAccountTokenFromRequest } from '@/lib/meta/resolveBrandToken'

export const runtime = 'nodejs'
export const maxDuration = 60

const PROCESSING_FAILED_STATUS = 502

interface VideoThumbnailRequestBody {
  readonly videoId?: string
}

// Fallback thumbnail for a video ad when the browser couldn't take a frame itself: Meta
// rejects a video creative without one. Answers "processing" until Meta has generated
// its frames, then copies the preferred frame into the ad account as an image hash.
// The client polls; one call never waits on Meta, so it stays far under maxDuration.
export async function POST(request: NextRequest): Promise<NextResponse> {
  const resolved = resolveAccountTokenFromRequest(request)
  if (!resolved.ok) return resolved.response

  let body: VideoThumbnailRequestBody
  try {
    body = (await request.json()) as VideoThumbnailRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  if (typeof body.videoId !== 'string' || !body.videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 })
  }

  try {
    const state = await fetchVideoThumbnailState(resolved.token, body.videoId)
    if (state.status === 'processing') {
      return NextResponse.json({ status: 'processing' })
    }
    if (state.status === 'failed') {
      return NextResponse.json({ error: state.reason }, { status: PROCESSING_FAILED_STATUS })
    }
    const thumbnailHash = await copyImageToAccount(resolved.token, resolved.accountId, state.uri)
    return NextResponse.json({ status: 'ready', thumbnailHash })
  } catch (err) {
    return metaErrorResponse(err)
  }
}

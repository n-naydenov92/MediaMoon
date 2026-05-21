import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  createAd,
  createAdCreative,
  CTA_TYPES,
  type CtaType,
  type PublishAdResult,
} from '@/lib/gateways/MetaAdsGateway'
import { resolveAccountTokenFromRequest } from '@/lib/meta/resolveBrandToken'

export const runtime = 'nodejs'
export const maxDuration = 30

type PublishStep = 'creative' | 'ad'

interface PublishRequestBody {
  readonly adSetId?: string
  readonly pageId?: string
  readonly headline?: string
  readonly bodyText?: string
  readonly destinationUrl?: string
  readonly ctaType?: string
  readonly adName?: string
  readonly instagramActorId?: string
  readonly imageHash?: string
  readonly videoId?: string
  readonly thumbnailHash?: string
}

function isCtaType(v: string): v is CtaType {
  return (CTA_TYPES as readonly string[]).includes(v)
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const resolved = resolveAccountTokenFromRequest(request)
  if (!resolved.ok) return resolved.response

  let body: PublishRequestBody
  try {
    body = (await request.json()) as PublishRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    adSetId, pageId, headline, bodyText, destinationUrl, ctaType, adName,
    instagramActorId, imageHash, videoId, thumbnailHash,
  } = body

  if (
    typeof adSetId !== 'string' || !adSetId
    || typeof pageId !== 'string' || !pageId
    || typeof headline !== 'string' || !headline
    || typeof bodyText !== 'string' || !bodyText
    || typeof destinationUrl !== 'string' || !destinationUrl
    || typeof ctaType !== 'string' || !isCtaType(ctaType)
    || typeof adName !== 'string' || !adName
  ) {
    return NextResponse.json({ error: 'Missing or invalid required fields' }, { status: 400 })
  }

  const hasImage = typeof imageHash === 'string' && imageHash.length > 0
  const hasVideo = typeof videoId === 'string' && videoId.length > 0
  if (hasImage === hasVideo) {
    return NextResponse.json(
      { error: 'Exactly one of imageHash or videoId must be provided' },
      { status: 400 },
    )
  }
  const hasThumbnail = typeof thumbnailHash === 'string' && thumbnailHash.length > 0
  if (hasVideo && !hasThumbnail) {
    return NextResponse.json(
      { error: 'thumbnailHash is required when publishing a video ad' },
      { status: 400 },
    )
  }

  let creativeId: string
  try {
    const creative = await createAdCreative(resolved.token, {
      accountId: resolved.accountId,
      headline,
      bodyText,
      destinationUrl,
      ctaType,
      pageId,
      instagramActorId: instagramActorId || undefined,
      imageHash: hasImage ? imageHash : undefined,
      videoId: hasVideo ? videoId : undefined,
      thumbnailHash: hasThumbnail ? thumbnailHash : undefined,
    })
    creativeId = creative.id
  } catch (err) {
    return errorResponse(err, 'creative')
  }

  let adId: string
  try {
    const ad = await createAd(resolved.token, resolved.accountId, adSetId, creativeId, adName)
    adId = ad.id
  } catch (err) {
    return errorResponse(err, 'ad')
  }

  const result: PublishAdResult = {
    adId,
    creativeId,
    mediaHash: hasImage ? imageHash : null,
    mediaId: hasVideo ? videoId : null,
  }
  return NextResponse.json({ result })
}

function errorResponse(err: unknown, step: PublishStep): NextResponse {
  const message = err instanceof Error ? err.message : 'Unknown error'
  return NextResponse.json({ error: message, step }, { status: 502 })
}

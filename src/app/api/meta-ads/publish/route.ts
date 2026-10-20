import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  createAd,
  createAdCreative,
  CTA_TYPES,
  type CtaType,
  type PublishAdResult,
} from '@/lib/gateways/MetaAdsGateway'
import { getInstagramAccountsCached } from '@/lib/meta/cachedMetaReads'
import { metaErrorResponse } from '@/lib/meta/metaErrorResponse'
import { resolveAccountTokenFromRequest } from '@/lib/meta/resolveBrandToken'

export const runtime = 'nodejs'
export const maxDuration = 30

const NUMERIC_ID = /^\d+$/

interface PublishRequestBody {
  readonly adSetId?: string
  readonly pageId?: string
  readonly headline?: string
  readonly bodyText?: string
  readonly description?: string
  readonly destinationUrl?: string
  readonly ctaType?: string
  readonly adName?: string
  readonly status?: string
  readonly instagramActorId?: string
  readonly autoResolveInstagram?: boolean
  readonly imageHash?: string
  readonly videoId?: string
  readonly thumbnailHash?: string
  // Set when resuming a publish whose creative already exists (the ad step failed),
  // so the retry does not create a second, orphaned creative.
  readonly creativeId?: string
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
    adSetId, pageId, headline, bodyText, description, destinationUrl, ctaType, adName, status,
    imageHash, videoId, thumbnailHash,
  } = body

  // Default to PAUSED; only go live when the client explicitly asks for ACTIVE.
  const adStatus: 'ACTIVE' | 'PAUSED' = status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED'

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

  let creativeId = reusableCreativeId(body.creativeId)
  if (!creativeId) {
    try {
      const creative = await createAdCreative(resolved.token, {
        accountId: resolved.accountId,
        headline,
        bodyText,
        description: typeof description === 'string' && description ? description : undefined,
        destinationUrl,
        ctaType,
        pageId,
        instagramActorId: await resolveInstagramActorId(resolved.token, pageId, body),
        imageHash: hasImage ? imageHash : undefined,
        videoId: hasVideo ? videoId : undefined,
        thumbnailHash: hasThumbnail ? thumbnailHash : undefined,
      })
      creativeId = creative.id
    } catch (err) {
      return metaErrorResponse(err, { step: 'creative' })
    }
  }

  let adId: string
  try {
    const ad = await createAd(resolved.token, resolved.accountId, adSetId, creativeId, adName, adStatus)
    adId = ad.id
  } catch (err) {
    return metaErrorResponse(err, { step: 'ad', creativeId })
  }

  const result: PublishAdResult = {
    adId,
    creativeId,
    mediaHash: hasImage ? imageHash : null,
    mediaId: hasVideo ? videoId : null,
  }
  return NextResponse.json({ result })
}

function reusableCreativeId(raw: unknown): string | null {
  return typeof raw === 'string' && NUMERIC_ID.test(raw) ? raw : null
}

// A failed Instagram lookup must not block the ad: the creative is then created
// without an Instagram identity.
async function resolveInstagramActorId(
  token: string,
  pageId: string,
  body: PublishRequestBody,
): Promise<string | undefined> {
  if (body.instagramActorId) {
    return body.instagramActorId
  }
  if (body.autoResolveInstagram !== true) {
    return undefined
  }
  try {
    const accounts = await getInstagramAccountsCached(pageId, token)
    return accounts[0]?.id
  } catch {
    return undefined
  }
}

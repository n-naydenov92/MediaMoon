import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  uploadImage,
  uploadVideo,
  createAdCreative,
  createAd,
  type CtaType,
  type PublishAdResult,
} from '@/lib/gateways/MetaAdsGateway'

type PublishStep = 'upload' | 'creative' | 'ad'

const CTA_TYPES = ['LEARN_MORE', 'SHOP_NOW', 'SIGN_UP'] as const

function isCtaType(v: string): v is CtaType {
  return (CTA_TYPES as readonly string[]).includes(v)
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const form = await request.formData()

  const accountId = form.get('accountId')
  const adSetId = form.get('adSetId')
  const pageId = form.get('pageId')
  const headline = form.get('headline')
  const bodyText = form.get('bodyText')
  const destinationUrl = form.get('destinationUrl')
  const ctaTypeRaw = form.get('ctaType')
  const attachmentTypeRaw = form.get('attachmentType')

  if (
    typeof accountId !== 'string' || !accountId ||
    typeof adSetId !== 'string' || !adSetId ||
    typeof pageId !== 'string' || !pageId ||
    typeof headline !== 'string' || !headline ||
    typeof bodyText !== 'string' || !bodyText ||
    typeof destinationUrl !== 'string' || !destinationUrl ||
    typeof ctaTypeRaw !== 'string' || !isCtaType(ctaTypeRaw)
  ) {
    return NextResponse.json({ error: 'Missing or invalid required fields' }, { status: 400 })
  }

  const ctaType = ctaTypeRaw
  let imageHash: string | undefined
  let mediaId: string | undefined

  const attachmentFile = form.get('attachment')
  if (attachmentFile instanceof File && attachmentFile.size > 0) {
    const attachmentType = typeof attachmentTypeRaw === 'string' ? attachmentTypeRaw : 'image'
    const arrayBuffer = await attachmentFile.arrayBuffer()
    try {
      if (attachmentType === 'video') {
        const result = await uploadVideo(accountId, arrayBuffer, attachmentFile.name, attachmentFile.type)
        mediaId = result.id
      } else {
        const result = await uploadImage(accountId, arrayBuffer, attachmentFile.name, attachmentFile.type)
        imageHash = result.hash
      }
    } catch (err) {
      return errorResponse(err, 'upload')
    }
  }

  let creativeId: string
  try {
    const creative = await createAdCreative({
      accountId, headline, bodyText, destinationUrl, ctaType, pageId, imageHash, videoId: mediaId,
    })
    creativeId = creative.id
  } catch (err) {
    return errorResponse(err, 'creative')
  }

  let adId: string
  try {
    const ad = await createAd(accountId, adSetId, creativeId, headline)
    adId = ad.id
  } catch (err) {
    return errorResponse(err, 'ad')
  }

  const result: PublishAdResult = {
    adId, creativeId, mediaHash: imageHash ?? null, mediaId: mediaId ?? null,
  }
  return NextResponse.json({ result })
}

function errorResponse(err: unknown, step: PublishStep): NextResponse {
  const message = err instanceof Error ? err.message : 'Unknown error'
  return NextResponse.json({ error: message, step }, { status: 502 })
}

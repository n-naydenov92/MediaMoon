import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { uploadImage } from '@/lib/gateways/MetaAdsGateway'
import { CROSS_BM_VIDEO_REASON, sameBusinessManager } from '@/config/metaBusinessManagers'
import { resolveAccountTokenFromRequest } from '@/lib/meta/resolveBrandToken'

export const runtime = 'nodejs'
export const maxDuration = 60

interface ReuploadRequestBody {
  readonly kind?: string
  readonly imageUrl?: string
  readonly videoId?: string
  readonly thumbnailUrl?: string
  readonly sourceAccountId?: string
}

// Makes an existing library creative's media usable by the target ad account.
// Images are re-uploaded into the target account (image hashes are per-account).
// Video files cannot be downloaded from Meta (the `source` field is not exposed for
// ad videos), but a video id is reusable by any account whose token can see it —
// i.e. accounts in the same Business Manager. So a same-BM video reuses its id
// directly (only its thumbnail is re-uploaded as an account-local image); a video
// from a different BM cannot be reused at all.
export async function POST(request: NextRequest): Promise<NextResponse> {
  const resolved = resolveAccountTokenFromRequest(request)
  if (!resolved.ok) return resolved.response
  const { token, accountId } = resolved

  let body: ReuploadRequestBody
  try {
    body = (await request.json()) as ReuploadRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    if (body.kind === 'image') {
      if (!body.imageUrl) {
        return NextResponse.json({ error: 'imageUrl is required for image re-upload' }, { status: 400 })
      }
      const imageHash = await reuploadImage(token, accountId, body.imageUrl)
      return NextResponse.json({ imageHash })
    }

    if (body.kind === 'video') {
      if (!body.videoId || !body.thumbnailUrl || !body.sourceAccountId) {
        return NextResponse.json(
          { error: 'videoId, thumbnailUrl and sourceAccountId are required for video re-use' },
          { status: 400 },
        )
      }
      if (!sameBusinessManager(body.sourceAccountId, accountId)) {
        return NextResponse.json({ error: CROSS_BM_VIDEO_REASON }, { status: 422 })
      }
      // Same BM: the token can reference the existing video id; only the thumbnail
      // must be turned into an account-local image hash for the publish step.
      const thumbnailHash = await reuploadImage(token, accountId, body.thumbnailUrl)
      return NextResponse.json({ videoId: body.videoId, thumbnailHash })
    }

    return NextResponse.json({ error: 'kind must be "image" or "video"' }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

async function reuploadImage(token: string, accountId: string, url: string): Promise<string> {
  const { bytes, mime } = await downloadBytes(url)
  const filename = mime.includes('png') ? 'library-image.png' : 'library-image.jpg'
  const { hash } = await uploadImage(token, accountId, bytes, filename, mime)
  return hash
}

async function downloadBytes(url: string): Promise<{ bytes: ArrayBuffer; mime: string }> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download source media (HTTP ${response.status})`)
  }
  const mime = response.headers.get('content-type') ?? 'application/octet-stream'
  const bytes = await response.arrayBuffer()
  return { bytes, mime }
}

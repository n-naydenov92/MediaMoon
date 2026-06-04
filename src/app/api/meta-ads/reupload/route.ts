import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { fetchVideoSource, uploadImage, uploadVideo } from '@/lib/gateways/MetaAdsGateway'
import { resolveAccountTokenFromRequest } from '@/lib/meta/resolveBrandToken'

export const runtime = 'nodejs'
export const maxDuration = 60

interface ReuploadRequestBody {
  readonly kind?: string
  readonly imageUrl?: string
  readonly videoId?: string
  readonly thumbnailUrl?: string
}

// Re-uploads an existing library creative's media into the target ad account, so
// the published ad references account-local hashes/ids (Meta hashes and video ids
// are not portable across accounts). Images become a fresh image hash; videos are
// re-uploaded and their thumbnail hashed too (required by the publish step).
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
      if (!body.videoId || !body.thumbnailUrl) {
        return NextResponse.json(
          { error: 'videoId and thumbnailUrl are required for video re-upload' },
          { status: 400 },
        )
      }
      const source = await fetchVideoSource(token, body.videoId)
      if (!source) {
        return NextResponse.json(
          { error: 'Source video is no longer downloadable from Meta' },
          { status: 422 },
        )
      }
      const video = await downloadBytes(source)
      const { id: videoId } = await uploadVideo(token, accountId, video.bytes, 'library-video.mp4', video.mime)
      const thumbnailHash = await reuploadImage(token, accountId, body.thumbnailUrl)
      return NextResponse.json({ videoId, thumbnailHash })
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

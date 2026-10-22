import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { startVideoUpload } from '@/lib/gateways/MetaAdsGateway'
import { metaErrorResponse } from '@/lib/meta/metaErrorResponse'
import { resolveAccountTokenFromRequest } from '@/lib/meta/resolveBrandToken'

export const runtime = 'nodejs'
export const maxDuration = 60

// Meta decides each chunk's range (start_offset..end_offset); this only caps it, since
// every chunk passes through a serverless function with a ~4.5 MB request body limit.
const MAX_CHUNK_BYTES = 4 * 1024 * 1024

interface StartRequestBody {
  readonly fileSize?: number
  readonly mediaType?: 'video' | 'image'
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const resolved = resolveAccountTokenFromRequest(request)
  if (!resolved.ok) return resolved.response

  let body: StartRequestBody
  try {
    body = (await request.json()) as StartRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (body.mediaType !== 'video' && body.mediaType !== 'image') {
    return NextResponse.json({ error: 'mediaType must be "video" or "image"' }, { status: 400 })
  }

  if (body.mediaType === 'image') {
    return NextResponse.json({ mode: 'single-shot' })
  }

  if (typeof body.fileSize !== 'number' || body.fileSize <= 0) {
    return NextResponse.json({ error: 'fileSize must be a positive number' }, { status: 400 })
  }

  try {
    const session = await startVideoUpload(resolved.token, resolved.accountId, body.fileSize)
    return NextResponse.json({
      mode: 'chunked',
      uploadSessionId: session.uploadSessionId,
      videoId: session.videoId,
      startOffset: session.startOffset,
      endOffset: session.endOffset,
      maxChunkSize: MAX_CHUNK_BYTES,
    })
  } catch (err) {
    return metaErrorResponse(err)
  }
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { transferVideoChunk } from '@/lib/gateways/MetaAdsGateway'
import { resolveAccountTokenFromRequest } from '@/lib/meta/resolveBrandToken'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_CHUNK_BYTES = 4 * 1024 * 1024

export async function POST(request: NextRequest): Promise<NextResponse> {
  const resolved = resolveAccountTokenFromRequest(request)
  if (!resolved.ok) return resolved.response

  const form = await request.formData()
  const uploadSessionId = form.get('uploadSessionId')
  const startOffsetRaw = form.get('startOffset')
  const chunk = form.get('chunk')

  if (typeof uploadSessionId !== 'string' || !uploadSessionId) {
    return NextResponse.json({ error: 'uploadSessionId is required' }, { status: 400 })
  }
  if (typeof startOffsetRaw !== 'string' || !/^\d+$/.test(startOffsetRaw)) {
    return NextResponse.json({ error: 'startOffset must be a non-negative integer' }, { status: 400 })
  }
  if (!(chunk instanceof Blob) || chunk.size === 0) {
    return NextResponse.json({ error: 'chunk file is required' }, { status: 400 })
  }
  if (chunk.size > MAX_CHUNK_BYTES) {
    return NextResponse.json(
      { error: `chunk too large: ${chunk.size} bytes (max ${MAX_CHUNK_BYTES})` },
      { status: 413 },
    )
  }

  const startOffset = Number(startOffsetRaw)

  try {
    const result = await transferVideoChunk(
      resolved.token,
      resolved.accountId,
      uploadSessionId,
      startOffset,
      chunk,
    )
    return NextResponse.json({
      startOffset: result.startOffset,
      endOffset: result.endOffset,
      complete: result.complete,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

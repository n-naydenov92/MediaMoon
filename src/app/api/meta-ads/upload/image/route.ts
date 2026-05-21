import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { uploadImage } from '@/lib/gateways/MetaAdsGateway'
import { resolveAccountTokenFromRequest } from '@/lib/meta/resolveBrandToken'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_IMAGE_BYTES = Math.floor(3.5 * 1024 * 1024)

export async function POST(request: NextRequest): Promise<NextResponse> {
  const resolved = resolveAccountTokenFromRequest(request)
  if (!resolved.ok) return resolved.response

  const form = await request.formData()
  const file = form.get('file')

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: `image too large: ${file.size} bytes (max ${MAX_IMAGE_BYTES}). Compress in browser before upload.` },
      { status: 413 },
    )
  }

  try {
    const bytes = await file.arrayBuffer()
    const result = await uploadImage(resolved.token, resolved.accountId, bytes, file.name, file.type)
    return NextResponse.json({ imageHash: result.hash })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { finishVideoUpload } from '@/lib/gateways/MetaAdsGateway'
import { resolveAccountTokenFromRequest } from '@/lib/meta/resolveBrandToken'

export const runtime = 'nodejs'
export const maxDuration = 60

interface FinalizeRequestBody {
  readonly uploadSessionId?: string
  readonly videoId?: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const resolved = resolveAccountTokenFromRequest(request)
  if (!resolved.ok) return resolved.response

  let body: FinalizeRequestBody
  try {
    body = (await request.json()) as FinalizeRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (typeof body.uploadSessionId !== 'string' || !body.uploadSessionId) {
    return NextResponse.json({ error: 'uploadSessionId is required' }, { status: 400 })
  }
  if (typeof body.videoId !== 'string' || !body.videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 })
  }

  try {
    await finishVideoUpload(resolved.token, resolved.accountId, body.uploadSessionId)
    return NextResponse.json({ videoId: body.videoId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

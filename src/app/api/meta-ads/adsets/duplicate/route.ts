import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { duplicateAdSet } from '@/lib/gateways/MetaAdsGateway'
import { resolveAccountTokenFromRequest } from '@/lib/meta/resolveBrandToken'

export const runtime = 'nodejs'
export const maxDuration = 30

interface DuplicateRequestBody {
  readonly adSetId?: string
  readonly newName?: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const resolved = resolveAccountTokenFromRequest(request)
  if (!resolved.ok) return resolved.response

  let body: DuplicateRequestBody
  try {
    body = (await request.json()) as DuplicateRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { adSetId, newName } = body
  if (
    typeof adSetId !== 'string' || !adSetId
    || typeof newName !== 'string' || !newName.trim()
  ) {
    return NextResponse.json({ error: 'adSetId and newName are required' }, { status: 400 })
  }

  try {
    const result = await duplicateAdSet(resolved.token, adSetId, newName.trim())
    return NextResponse.json({ result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getPixelsCached } from '@/lib/meta/cachedMetaReads'
import { metaErrorResponse } from '@/lib/meta/metaErrorResponse'
import { resolveAccountTokenFromRequest } from '@/lib/meta/resolveBrandToken'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(request: NextRequest): Promise<NextResponse> {
  const resolved = resolveAccountTokenFromRequest(request)
  if (!resolved.ok) return resolved.response

  try {
    const pixels = await getPixelsCached(resolved.accountId, resolved.token)
    return NextResponse.json({ result: pixels })
  } catch (err) {
    return metaErrorResponse(err)
  }
}

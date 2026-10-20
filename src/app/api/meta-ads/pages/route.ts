import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getPagesCached } from '@/lib/meta/cachedMetaReads'
import { metaErrorResponse } from '@/lib/meta/metaErrorResponse'
import { resolveBrandTokenFromRequest } from '@/lib/meta/resolveBrandToken'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const resolved = resolveBrandTokenFromRequest(request)
  if (!resolved.ok) return resolved.response

  try {
    const pages = await getPagesCached(resolved.brandId, resolved.token)
    return NextResponse.json({ pages })
  } catch (err) {
    return metaErrorResponse(err)
  }
}

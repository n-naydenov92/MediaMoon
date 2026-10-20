import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDsaEntitiesCached } from '@/lib/meta/cachedMetaReads'
import { metaErrorResponse } from '@/lib/meta/metaErrorResponse'
import { resolveAccountTokenFromRequest } from '@/lib/meta/resolveBrandToken'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const resolved = resolveAccountTokenFromRequest(request)
  if (!resolved.ok) return resolved.response

  try {
    const dsaEntities = await getDsaEntitiesCached(resolved.accountId, resolved.token)
    return NextResponse.json({ dsaEntities })
  } catch (err) {
    return metaErrorResponse(err)
  }
}

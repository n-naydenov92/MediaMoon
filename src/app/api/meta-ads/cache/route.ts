import { NextResponse } from 'next/server'
import { expireMetaAssets } from '@/lib/meta/cachedMetaReads'

const NO_CONTENT_STATUS = 204

// Clears the cached ad accounts, Pages, Instagram accounts, pixels and DSA lists for all
// brands. Next applies the expiry just after this response is sent; the client's reload
// requests follow a network round trip later, so they read fresh lists.
export function DELETE(): NextResponse {
  expireMetaAssets()
  return new NextResponse(null, { status: NO_CONTENT_STATUS })
}

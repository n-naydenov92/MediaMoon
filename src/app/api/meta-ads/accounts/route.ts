import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isBrandId } from '@/config/brands'
import { getConfiguredBusinessManagersForBrand } from '@/config/metaTokens'
import type { AdAccount } from '@/lib/gateways/MetaAdsGateway'
import { getAdAccountsCached } from '@/lib/meta/cachedMetaReads'
import { metaErrorResponse } from '@/lib/meta/metaErrorResponse'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const brandIdRaw = request.nextUrl.searchParams.get('brandId')
  if (!brandIdRaw) {
    return NextResponse.json({ error: 'brandId query param is required' }, { status: 400 })
  }
  if (!isBrandId(brandIdRaw)) {
    return NextResponse.json({ error: `unknown brandId: ${brandIdRaw}` }, { status: 400 })
  }

  const configured = getConfiguredBusinessManagersForBrand(brandIdRaw)
  if (configured.length === 0) {
    return NextResponse.json(
      { error: `Meta token not configured for brand "${brandIdRaw}"` },
      { status: 503 },
    )
  }

  try {
    const perBmAccounts = await Promise.all(configured.map(getAdAccountsCached))
    const accountsById = new Map<string, AdAccount>()
    for (const account of perBmAccounts.flat()) {
      if (!accountsById.has(account.id)) {
        accountsById.set(account.id, account)
      }
    }
    return NextResponse.json({ accounts: Array.from(accountsById.values()) })
  } catch (err) {
    return metaErrorResponse(err)
  }
}

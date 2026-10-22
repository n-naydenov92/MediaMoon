import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getBrandContext, getMetaConnectionsForBrand } from '@/lib/tenancy'
import { fetchAdAccounts, type AdAccount } from '@/lib/gateways/MetaAdsGateway'
import { metaErrorResponse } from '@/lib/meta/metaErrorResponse'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const brandIdRaw = request.nextUrl.searchParams.get('brandId')
  if (!brandIdRaw) {
    return NextResponse.json({ error: 'brandId query param is required' }, { status: 400 })
  }
  if (!(await getBrandContext(brandIdRaw))) {
    return NextResponse.json({ error: `unknown brandId: ${brandIdRaw}` }, { status: 400 })
  }

  const connections = await getMetaConnectionsForBrand(brandIdRaw)
  if (connections.length === 0) {
    return NextResponse.json(
      { error: `Meta token not configured for brand "${brandIdRaw}"` },
      { status: 503 },
    )
  }

  try {
    const perBmAccounts = await Promise.all(connections.map(({ token }) => fetchAdAccounts(token)))
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

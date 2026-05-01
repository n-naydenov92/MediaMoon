import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { fetchCampaigns } from '@/lib/gateways/MetaAdsGateway'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const accountId = request.nextUrl.searchParams.get('accountId')
  if (typeof accountId !== 'string' || !accountId) {
    return NextResponse.json({ error: 'accountId query param is required' }, { status: 400 })
  }
  try {
    const campaigns = await fetchCampaigns(accountId)
    return NextResponse.json({ campaigns })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

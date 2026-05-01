import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { fetchAdSets } from '@/lib/gateways/MetaAdsGateway'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const campaignId = request.nextUrl.searchParams.get('campaignId')
  if (typeof campaignId !== 'string' || !campaignId) {
    return NextResponse.json({ error: 'campaignId query param is required' }, { status: 400 })
  }
  try {
    const adSets = await fetchAdSets(campaignId)
    return NextResponse.json({ adSets })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

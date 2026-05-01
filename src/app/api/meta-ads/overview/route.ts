import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const BASE = 'https://graph.facebook.com/v21.0'
const TOKEN = process.env.META_ACCESS_TOKEN ?? ''

async function get<T>(path: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams({ ...params, access_token: TOKEN })
  const res = await fetch(`${BASE}${path}?${qs}`)
  return res.json() as Promise<T>
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const accountId = request.nextUrl.searchParams.get('accountId')
  const campaignId = request.nextUrl.searchParams.get('campaignId')

  if (!accountId) {
    return NextResponse.json({ error: 'accountId required' }, { status: 400 })
  }

  // If campaignId provided — return adsets + ads for that campaign
  if (campaignId) {
    const adsets = await get<{ data: unknown[]; error?: unknown }>(
      `/${campaignId}/adsets`,
      { fields: 'id,name,status,effective_status,daily_budget,lifetime_budget,budget_remaining', limit: '100' },
    )
    if (adsets.error) return NextResponse.json({ error: adsets.error }, { status: 502 })

    const adsetsWithAds = await Promise.all(
      (adsets.data ?? []).map(async (a) => {
        const adset = a as Record<string, unknown>
        const ads = await get<{ data: unknown[]; error?: unknown }>(
          `/${adset['id'] as string}/ads`,
          { fields: 'id,name,status,effective_status,created_time', limit: '100' },
        )
        return { ...adset, ads: ads.data ?? [] }
      }),
    )
    return NextResponse.json({ campaignId, adsets: adsetsWithAds })
  }

  // Default — return campaigns only
  const campaigns = await get<{ data: unknown[]; error?: unknown }>(
    `/${accountId}/campaigns`,
    { fields: 'id,name,status,effective_status,lifetime_budget,budget_remaining', limit: '100' },
  )
  if (campaigns.error) return NextResponse.json({ error: campaigns.error }, { status: 502 })

  return NextResponse.json({ accountId, campaigns: campaigns.data ?? [] })
}

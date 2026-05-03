import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { resolveBrandTokenFromRequest } from '@/lib/meta/resolveBrandToken'

const BASE = 'https://graph.facebook.com/v21.0'

async function get<T>(token: string, path: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams({ ...params, access_token: token })
  const res = await fetch(`${BASE}${path}?${qs}`)
  return res.json() as Promise<T>
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const resolved = resolveBrandTokenFromRequest(request)
  if (!resolved.ok) return resolved.response
  const token = resolved.token

  const accountId = request.nextUrl.searchParams.get('accountId')
  const campaignId = request.nextUrl.searchParams.get('campaignId')

  if (!accountId) {
    return NextResponse.json({ error: 'accountId required' }, { status: 400 })
  }

  if (campaignId) {
    const adsets = await get<{ data: unknown[]; error?: unknown }>(
      token,
      `/${campaignId}/adsets`,
      { fields: 'id,name,status,effective_status,daily_budget,lifetime_budget,budget_remaining', limit: '100' },
    )
    if (adsets.error) return NextResponse.json({ error: adsets.error }, { status: 502 })

    const adsetsWithAds = await Promise.all(
      (adsets.data ?? []).map(async (a) => {
        const adset = a as Record<string, unknown>
        const ads = await get<{ data: unknown[]; error?: unknown }>(
          token,
          `/${adset['id'] as string}/ads`,
          { fields: 'id,name,status,effective_status,created_time', limit: '100' },
        )
        return { ...adset, ads: ads.data ?? [] }
      }),
    )
    return NextResponse.json({ campaignId, adsets: adsetsWithAds })
  }

  const campaigns = await get<{ data: unknown[]; error?: unknown }>(
    token,
    `/${accountId}/campaigns`,
    { fields: 'id,name,status,effective_status,lifetime_budget,budget_remaining', limit: '100' },
  )
  if (campaigns.error) return NextResponse.json({ error: campaigns.error }, { status: 502 })

  return NextResponse.json({ accountId, campaigns: campaigns.data ?? [] })
}

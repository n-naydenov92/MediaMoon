import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { resolveBrandTokenFromRequest } from '@/lib/meta/resolveBrandToken'

const BASE = 'https://graph.facebook.com/v21.0'

const FIELDS = [
  'impressions',
  'reach',
  'frequency',
  'spend',
  'cpm',
  'cpc',
  'ctr',
  'inline_link_clicks',
  'cost_per_inline_link_click',
  'inline_link_click_ctr',
  'actions',
  'cost_per_action_type',
  'action_values',
  'website_purchase_roas',
].join(',')

export async function GET(request: NextRequest): Promise<NextResponse> {
  const resolved = resolveBrandTokenFromRequest(request)
  if (!resolved.ok) return resolved.response
  const token = resolved.token

  const adId = request.nextUrl.searchParams.get('adId')
  if (!adId) {
    return NextResponse.json({ error: 'adId required' }, { status: 400 })
  }

  const datePreset = request.nextUrl.searchParams.get('datePreset') ?? 'today'

  const qs = new URLSearchParams({
    fields: FIELDS,
    date_preset: datePreset,
    access_token: token,
  })

  const creativeFields = [
    'id', 'name', 'status', 'effective_status', 'created_time', 'adset_id',
    'creative{id,name,title,body,image_url,thumbnail_url,object_story_spec,asset_feed_spec,effective_object_story_id}',
  ].join(',')

  const [insightsRes, adRes] = await Promise.all([
    fetch(`${BASE}/${adId}/insights?${qs}`),
    fetch(`${BASE}/${adId}?fields=${encodeURIComponent(creativeFields)}&access_token=${token}`),
  ])

  const insights = await insightsRes.json() as { data?: unknown[]; error?: unknown }
  const ad = await adRes.json() as Record<string, unknown>

  const creative = ad['creative'] as Record<string, unknown> | undefined
  const storyId = creative?.['effective_object_story_id'] as string | undefined

  const storySpec = creative?.['object_story_spec'] as Record<string, unknown> | undefined
  const videoData = storySpec?.['video_data'] as Record<string, unknown> | undefined
  const videoId = videoData?.['video_id'] as string | undefined

  const [postPreview, videoSource] = await Promise.all([
    storyId
      ? fetch(`${BASE}/${storyId}?fields=message,story,attachments{media,title,description,url}&access_token=${token}`)
          .then((r) => r.json())
      : Promise.resolve(null),
    videoId
      ? fetch(`${BASE}/${videoId}?fields=source,thumbnails&access_token=${token}`)
          .then((r) => r.json() as Promise<{ source?: string; thumbnails?: { data?: { uri?: string }[] }; error?: unknown }>)
      : Promise.resolve(null),
  ])

  return NextResponse.json({
    ad,
    post_preview: postPreview,
    video_url: videoSource?.source ?? null,
    video_thumbnail: videoSource?.thumbnails?.data?.[0]?.uri ?? null,
    insights: insights.data?.[0] ?? null,
    insights_error: insights.error ?? null,
  })
}

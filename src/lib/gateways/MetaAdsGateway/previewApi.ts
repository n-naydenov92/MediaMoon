import { MetaApiError } from './graphErrors'
import { buildUrl, callGraphApi } from './http'

const PREVIEW_INSIGHTS_FIELDS = [
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

const PREVIEW_AD_FIELDS = [
  'id', 'name', 'status', 'effective_status', 'created_time', 'adset_id',
  'creative{id,name,title,body,image_url,thumbnail_url,object_story_spec,asset_feed_spec,effective_object_story_id}',
].join(',')

const POST_PREVIEW_FIELDS = 'message,story,from{name,id},full_picture,attachments{media,title,description,url,subattachments}'
const VIDEO_PREVIEW_FIELDS = 'source,thumbnails'

type GraphObject = Record<string, unknown>

export interface EmbeddedGraphError {
  readonly error: { readonly code: number | null; readonly message: string }
}

export interface AdPreview {
  readonly ad: GraphObject | EmbeddedGraphError
  readonly postPreview: GraphObject | EmbeddedGraphError | null
  readonly videoUrl: string | null
  readonly videoThumbnail: string | null
  readonly insights: unknown
  readonly insightsError: EmbeddedGraphError['error'] | null
}

interface GraphInsightsList {
  readonly data?: readonly unknown[]
}

interface GraphVideoPreview {
  readonly source?: string
  readonly thumbnails?: { readonly data?: readonly { readonly uri?: string }[] }
}

// Hover preview for one ad. Graph errors travel inside the payload ({ error }) instead
// of failing the whole preview, so one broken part (e.g. the post) still lets the rest
// render.
export async function fetchAdPreview(token: string, adId: string, datePreset: string): Promise<AdPreview> {
  const [insights, ad] = await Promise.all([
    embedGraphError(callGraphApi<GraphInsightsList>(buildUrl(`/${adId}/insights`, token, {
      fields: PREVIEW_INSIGHTS_FIELDS,
      date_preset: datePreset,
    }))),
    embedGraphError(callGraphApi<GraphObject>(buildUrl(`/${adId}`, token, { fields: PREVIEW_AD_FIELDS }))),
  ])
  const { storyId, videoId } = previewTargets(ad)
  const [postPreview, video] = await Promise.all([
    storyId
      ? embedGraphError(callGraphApi<GraphObject>(buildUrl(`/${storyId}`, token, { fields: POST_PREVIEW_FIELDS })))
      : null,
    videoId
      ? embedGraphError(callGraphApi<GraphVideoPreview>(buildUrl(`/${videoId}`, token, { fields: VIDEO_PREVIEW_FIELDS })))
      : null,
  ])
  const videoPreview = video && !isEmbeddedError(video) ? video : null
  return {
    ad,
    postPreview,
    videoUrl: videoPreview?.source ?? null,
    videoThumbnail: videoPreview?.thumbnails?.data?.[0]?.uri ?? null,
    insights: isEmbeddedError(insights) ? null : (insights.data?.[0] ?? null),
    insightsError: isEmbeddedError(insights) ? insights.error : null,
  }
}

function previewTargets(ad: GraphObject | EmbeddedGraphError): { storyId?: string; videoId?: string } {
  if (isEmbeddedError(ad)) {
    return {}
  }
  const creative = ad.creative as GraphObject | undefined
  const storySpec = creative?.object_story_spec as GraphObject | undefined
  const videoData = storySpec?.video_data as GraphObject | undefined
  return {
    storyId: creative?.effective_object_story_id as string | undefined,
    videoId: videoData?.video_id as string | undefined,
  }
}

async function embedGraphError<T>(request: Promise<T>): Promise<T | EmbeddedGraphError> {
  try {
    return await request
  } catch (err) {
    if (!(err instanceof MetaApiError)) {
      throw err
    }
    return { error: { code: err.code, message: err.message } }
  }
}

function isEmbeddedError(value: unknown): value is EmbeddedGraphError {
  return typeof value === 'object' && value !== null && 'error' in value
}

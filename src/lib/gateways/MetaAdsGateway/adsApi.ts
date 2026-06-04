import { buildUrl, callGraphApi } from './http'
import { classifyCreativeType } from './creativeClassifier'
import {
  INSIGHTS_FIELDS,
  rowToTotals,
  type GraphAction,
} from './insightsParsers'
import type {
  AdCreativeElements,
  AdInsightsFilter,
  AdWithCreativeElements,
  AdWithInsights,
} from './types'

const DEFAULT_ADS_LIMIT = 500
const MAX_INSIGHTS_PAGES = 50
const AD_METADATA_BATCH_SIZE = 50
const FILTERED_INSIGHTS_FIELDS = `ad_id,${INSIGHTS_FIELDS}`

interface GraphAdInsightsRow {
  ad_id?: string
  spend?: string
  impressions?: string
  clicks?: string
  inline_link_clicks?: string
  actions?: GraphAction[]
  action_values?: GraphAction[]
}

interface GraphAdInsightsResponse {
  data?: GraphAdInsightsRow[]
  error?: { message: string; type: string; code: number }
  paging?: { next?: string }
}

interface GraphAdWithCreativeRaw {
  id: string
  name: string
  status: string
  effective_status: string
  creative?: {
    id?: string
    thumbnail_url?: string
    object_type?: string
    video_id?: string
  }
}

interface GraphAdsListResponse {
  data?: GraphAdWithCreativeRaw[]
  error?: { message: string; type: string; code: number }
  paging?: { next?: string }
}

export async function fetchAdsWithInsights(
  token: string,
  accountId: string,
  currency: string,
  dateParams: Record<string, string>,
  options: {
    readonly limit?: number
    readonly filters?: readonly AdInsightsFilter[]
  } = {},
): Promise<readonly AdWithInsights[]> {
  const limit = options.limit ?? DEFAULT_ADS_LIMIT
  const filters = options.filters ?? [{ field: 'spend', operator: 'GREATER_THAN', value: 0 }]

  const insightsRows = await fetchFilteredAdInsightsRows(
    token,
    accountId,
    dateParams,
    filters,
    limit,
  )
  if (insightsRows.length === 0) {
    return []
  }

  const adIds = insightsRows.map((r) => r.ad_id).filter((id): id is string => Boolean(id))
  const metadataById = await fetchAdsMetadataByIds(token, accountId, adIds)

  return insightsRows
    .map((row) => {
      const meta = row.ad_id ? metadataById.get(row.ad_id) : undefined
      return meta ? mergeAdInsightsWithMeta(row, meta, accountId, currency) : null
    })
    .filter((ad): ad is AdWithInsights => ad !== null)
}

async function fetchFilteredAdInsightsRows(
  token: string,
  accountId: string,
  dateParams: Record<string, string>,
  filters: readonly AdInsightsFilter[],
  limit: number,
): Promise<readonly GraphAdInsightsRow[]> {
  const params: Record<string, string> = {
    level: 'ad',
    fields: FILTERED_INSIGHTS_FIELDS,
    filtering: JSON.stringify(filters),
    limit: String(limit),
    ...dateParams,
  }
  let url: string | null = buildUrl(`/${accountId}/insights`, token, params)
  const all: GraphAdInsightsRow[] = []
  for (let page = 0; page < MAX_INSIGHTS_PAGES && url; page += 1) {
    const json: GraphAdInsightsResponse = await callGraphApi<GraphAdInsightsResponse>(url)
    if (json.error) {
      throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
    }
    all.push(...(json.data ?? []))
    url = json.paging?.next ?? null
  }
  return all
}

async function fetchAdsMetadataByIds(
  token: string,
  accountId: string,
  adIds: readonly string[],
): Promise<ReadonlyMap<string, GraphAdWithCreativeRaw>> {
  const fields = 'id,name,status,effective_status,creative{id,thumbnail_url,object_type,video_id}'
  const byId = new Map<string, GraphAdWithCreativeRaw>()
  for (let i = 0; i < adIds.length; i += AD_METADATA_BATCH_SIZE) {
    const chunk = adIds.slice(i, i + AD_METADATA_BATCH_SIZE)
    const url = buildUrl(`/${accountId}/ads`, token, {
      fields,
      filtering: JSON.stringify([{ field: 'ad.id', operator: 'IN', value: chunk }]),
      limit: String(chunk.length),
    })
    const json = await callGraphApi<GraphAdsListResponse>(url)
    if (json.error) {
      throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
    }
    for (const raw of json.data ?? []) {
      byId.set(raw.id, raw)
    }
  }
  return byId
}

function mergeAdInsightsWithMeta(
  row: GraphAdInsightsRow,
  meta: GraphAdWithCreativeRaw,
  accountId: string,
  currency: string,
): AdWithInsights {
  return {
    id: meta.id,
    name: meta.name,
    status: meta.status,
    effectiveStatus: meta.effective_status,
    creativeType: classifyCreativeType(meta.creative),
    thumbnailUrl: meta.creative?.thumbnail_url ?? null,
    accountId,
    currency,
    insights: rowToTotals(row),
  }
}

const ELEMENTS_METADATA_FIELDS =
  'id,name,status,effective_status,'
  + 'creative{id,thumbnail_url,image_url,object_type,video_id,body,title,image_hash,link_url,'
  + 'object_story_spec{link_data{message,image_hash,link,call_to_action},'
  + 'video_data{message,video_id,image_hash,image_url,call_to_action}},'
  + 'asset_feed_spec{bodies,titles,link_urls}}'

interface GraphAssetText {
  text?: string
}

interface GraphCallToAction {
  value?: { link?: string }
}

interface GraphCreativeElementsRaw {
  id?: string
  thumbnail_url?: string
  image_url?: string
  object_type?: string
  video_id?: string
  body?: string
  title?: string
  image_hash?: string
  link_url?: string
  object_story_spec?: {
    link_data?: { message?: string; image_hash?: string; link?: string; call_to_action?: GraphCallToAction }
    video_data?: { message?: string; video_id?: string; image_hash?: string; image_url?: string; call_to_action?: GraphCallToAction }
  }
  asset_feed_spec?: {
    bodies?: GraphAssetText[]
    titles?: GraphAssetText[]
    link_urls?: { website_url?: string }[]
  }
}

interface GraphAdWithElementsRaw {
  id: string
  name: string
  status: string
  effective_status: string
  creative?: GraphCreativeElementsRaw
}

interface GraphAdsElementsResponse {
  data?: GraphAdWithElementsRaw[]
  error?: { message: string; type: string; code: number }
  paging?: { next?: string }
}

/** Same insights-then-metadata flow as {@link fetchAdsWithInsights}, but enriches
 *  each ad with the reusable copy/asset pieces (bodies, titles, image hash, video
 *  id) so the Ads Creator library can decompose them into addable elements. */
export async function fetchAdElementsWithInsights(
  token: string,
  accountId: string,
  currency: string,
  dateParams: Record<string, string>,
  options: {
    readonly limit?: number
    readonly filters?: readonly AdInsightsFilter[]
  } = {},
): Promise<readonly AdWithCreativeElements[]> {
  const limit = options.limit ?? DEFAULT_ADS_LIMIT
  const filters = options.filters ?? [{ field: 'spend', operator: 'GREATER_THAN', value: 0 }]

  const insightsRows = await fetchFilteredAdInsightsRows(
    token,
    accountId,
    dateParams,
    filters,
    limit,
  )
  if (insightsRows.length === 0) {
    return []
  }

  const adIds = insightsRows.map((r) => r.ad_id).filter((id): id is string => Boolean(id))
  const metadataById = await fetchAdElementsMetadataByIds(token, accountId, adIds)

  return insightsRows
    .map((row) => {
      const meta = row.ad_id ? metadataById.get(row.ad_id) : undefined
      if (!meta) {
        return null
      }
      const base = mergeAdInsightsWithMeta(row, meta, accountId, currency)
      return { ...base, elements: parseCreativeElements(meta.creative) }
    })
    .filter((ad): ad is AdWithCreativeElements => ad !== null)
}

async function fetchAdElementsMetadataByIds(
  token: string,
  accountId: string,
  adIds: readonly string[],
): Promise<ReadonlyMap<string, GraphAdWithElementsRaw>> {
  const byId = new Map<string, GraphAdWithElementsRaw>()
  for (let i = 0; i < adIds.length; i += AD_METADATA_BATCH_SIZE) {
    const chunk = adIds.slice(i, i + AD_METADATA_BATCH_SIZE)
    const url = buildUrl(`/${accountId}/ads`, token, {
      fields: ELEMENTS_METADATA_FIELDS,
      filtering: JSON.stringify([{ field: 'ad.id', operator: 'IN', value: chunk }]),
      limit: String(chunk.length),
      // Default thumbnail_url is 64×64 (pixelated when scaled to a card); request a
      // larger render so video thumbnails match the full-res image_url crispness.
      thumbnail_width: '400',
      thumbnail_height: '400',
    })
    const json = await callGraphApi<GraphAdsElementsResponse>(url)
    if (json.error) {
      throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
    }
    for (const raw of json.data ?? []) {
      byId.set(raw.id, raw)
    }
  }
  return byId
}

export interface RankedAdInsightsRow {
  readonly adId: string
  readonly insights: ReturnType<typeof rowToTotals>
}

/** Lightweight first phase for the paginated Ad Library: fetch ad-level insights
 *  sorted by spend (Meta-side), stopping once `max` rows are collected. Lets the
 *  caller take only the top page by spend instead of paginating the whole account
 *  (which is what trips Meta's app rate limit on large windows). */
export async function fetchRankedAdInsights(
  token: string,
  accountId: string,
  dateParams: Record<string, string>,
  options: { readonly filters: readonly AdInsightsFilter[]; readonly max: number },
): Promise<readonly RankedAdInsightsRow[]> {
  const max = Math.max(options.max, 1)
  const params: Record<string, string> = {
    level: 'ad',
    fields: FILTERED_INSIGHTS_FIELDS,
    filtering: JSON.stringify(options.filters),
    sort: 'spend_descending',
    limit: String(Math.min(max, DEFAULT_ADS_LIMIT)),
    ...dateParams,
  }
  let url: string | null = buildUrl(`/${accountId}/insights`, token, params)
  const rows: GraphAdInsightsRow[] = []
  for (let page = 0; page < MAX_INSIGHTS_PAGES && url && rows.length < max; page += 1) {
    const json: GraphAdInsightsResponse = await callGraphApi<GraphAdInsightsResponse>(url)
    if (json.error) {
      throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
    }
    rows.push(...(json.data ?? []))
    url = json.paging?.next ?? null
  }
  return rows
    .slice(0, max)
    .filter((r): r is GraphAdInsightsRow & { ad_id: string } => Boolean(r.ad_id))
    .map((r) => ({ adId: r.ad_id, insights: rowToTotals(r) }))
}

/** Second phase: fetch the creative metadata + decompose elements for a specific
 *  set of already-ranked ads (one page). Metadata is the expensive call, so it is
 *  only ever fetched for the visible page, never for ads beyond it. */
export async function fetchElementsForAdIds(
  token: string,
  accountId: string,
  currency: string,
  rows: readonly RankedAdInsightsRow[],
): Promise<readonly AdWithCreativeElements[]> {
  if (rows.length === 0) {
    return []
  }
  const metadataById = await fetchAdElementsMetadataByIds(
    token,
    accountId,
    rows.map((r) => r.adId),
  )
  return rows
    .map((row) => {
      const meta = metadataById.get(row.adId)
      if (!meta) {
        return null
      }
      const base: AdWithInsights = {
        id: meta.id,
        name: meta.name,
        status: meta.status,
        effectiveStatus: meta.effective_status,
        creativeType: classifyCreativeType(meta.creative),
        thumbnailUrl: meta.creative?.thumbnail_url ?? null,
        accountId,
        currency,
        insights: row.insights,
      }
      return { ...base, elements: parseCreativeElements(meta.creative) }
    })
    .filter((ad): ad is AdWithCreativeElements => ad !== null)
}

function parseCreativeElements(creative: GraphCreativeElementsRaw | undefined): AdCreativeElements {
  if (!creative) {
    return { bodies: [], titles: [], urls: [], imageHash: null, imageUrl: null, videoId: null }
  }
  const spec = creative.object_story_spec
  return {
    bodies: collectTexts(
      creative.asset_feed_spec?.bodies,
      creative.body ?? spec?.link_data?.message ?? spec?.video_data?.message,
    ),
    titles: collectTexts(creative.asset_feed_spec?.titles, creative.title),
    urls: collectUrls(creative),
    imageHash: creative.image_hash
      ?? spec?.link_data?.image_hash
      ?? spec?.video_data?.image_hash
      ?? null,
    imageUrl: creative.image_url ?? spec?.video_data?.image_url ?? null,
    videoId: creative.video_id ?? spec?.video_data?.video_id ?? null,
  }
}

// Destination URLs across the creative shapes: classic link_data/video_data
// links, the creative-level link_url, and dynamic-creative link_urls. Trimmed,
// de-duplicated within the one ad.
function collectUrls(creative: GraphCreativeElementsRaw): readonly string[] {
  const spec = creative.object_story_spec
  const candidates = [
    spec?.link_data?.link,
    spec?.link_data?.call_to_action?.value?.link,
    spec?.video_data?.call_to_action?.value?.link,
    creative.link_url,
    ...(creative.asset_feed_spec?.link_urls?.map((l) => l.website_url) ?? []),
  ]
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of candidates) {
    const url = (raw ?? '').trim()
    if (url && !seen.has(url)) {
      seen.add(url)
      out.push(url)
    }
  }
  return out
}

// Dynamic-creative assets win when present; otherwise fall back to the single
// classic value. Trims, drops blanks, and de-duplicates within the one ad.
function collectTexts(
  assets: readonly GraphAssetText[] | undefined,
  fallback: string | undefined,
): readonly string[] {
  const source = assets && assets.length > 0
    ? assets.map((a) => a.text ?? '')
    : [fallback ?? '']
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of source) {
    const text = raw.trim()
    if (text && !seen.has(text)) {
      seen.add(text)
      out.push(text)
    }
  }
  return out
}

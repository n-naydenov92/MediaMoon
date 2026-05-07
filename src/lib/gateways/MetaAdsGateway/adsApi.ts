import { buildUrl, callGraphApi } from './http'
import { classifyCreativeType } from './creativeClassifier'
import {
  INSIGHTS_FIELDS,
  rowToTotals,
  type GraphAction,
} from './insightsParsers'
import type { AdInsightsFilter, AdWithInsights } from './types'

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

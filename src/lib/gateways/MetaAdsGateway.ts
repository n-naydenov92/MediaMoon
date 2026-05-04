const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0'
const LIST_FETCH_TIMEOUT_MS = 30_000
const UPLOAD_FETCH_TIMEOUT_MS = 120_000
const DEFAULT_ADS_LIMIT = 500
const MAX_INSIGHTS_PAGES = 50

// Meta returns the same purchase under multiple action_type rows (e.g. both
// `purchase` and `omni_purchase` and `offsite_conversion.fb_pixel_purchase`).
// Summing all of them double-counts. `omni_purchase` is what Ads Manager UI
// shows as the canonical "Purchases" / "Purchase Conversion Value".
const PURCHASE_ACTION_TYPE = 'omni_purchase'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdAccount {
  readonly id: string
  readonly name: string
  readonly accountStatus: number
  readonly currency: string
  readonly timezoneName: string
}

export interface Campaign {
  readonly id: string
  readonly name: string
  readonly status: string
  readonly effectiveStatus: string
}

export interface AdSet {
  readonly id: string
  readonly name: string
  readonly status: string
  readonly effectiveStatus: string
}

export interface Page {
  readonly id: string
  readonly name: string
}

export type CtaType = 'LEARN_MORE' | 'SHOP_NOW' | 'SIGN_UP'

export interface AdCreativeParams {
  readonly accountId: string
  readonly headline: string
  readonly bodyText: string
  readonly destinationUrl: string
  readonly ctaType: CtaType
  readonly pageId: string
  readonly imageHash?: string
  readonly videoId?: string
}

export interface PublishAdResult {
  readonly adId: string
  readonly creativeId: string
  readonly mediaHash: string | null
  readonly mediaId: string | null
}

// ─── Raw Graph API shapes ─────────────────────────────────────────────────────

interface GraphAdAccountRaw {
  id: string
  name: string
  account_status: number
  currency: string
  timezone_name: string
}

interface GraphCampaignRaw {
  id: string
  name: string
  status: string
  effective_status: string
}

interface GraphAdSetRaw {
  id: string
  name: string
  status: string
  effective_status: string
}

interface GraphPageRaw {
  id: string
  name: string
}

interface GraphListResponse<T> {
  data: T[]
  error?: { message: string; type: string; code: number }
}

interface GraphSummaryResponse {
  data?: unknown[]
  summary?: { total_count?: number }
  error?: { message: string; type: string; code: number }
}

interface GraphImageUploadResponse {
  images: Record<string, { hash: string; url: string }>
  error?: { message: string; type: string; code: number }
}

interface GraphVideoUploadResponse {
  id: string
  error?: { message: string; type: string; code: number }
}

interface GraphCreativeResponse {
  id: string
  error?: { message: string; type: string; code: number }
}

interface GraphAdResponse {
  id: string
  error?: { message: string; type: string; code: number }
}

// ─── Public functions ─────────────────────────────────────────────────────────

export async function fetchAdAccounts(token: string): Promise<readonly AdAccount[]> {
  const url = buildUrl('/me/adaccounts', token, {
    fields: 'id,name,account_status,currency,timezone_name',
    limit: '100',
  })
  const json = await callGraphApi<GraphListResponse<GraphAdAccountRaw>>(url)
  if (json.error) throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  return (json.data ?? []).map(toAdAccount)
}

export async function fetchCampaigns(token: string, accountId: string): Promise<readonly Campaign[]> {
  const url = buildUrl(`/${accountId}/campaigns`, token, {
    fields: 'id,name,status,effective_status',
    limit: '100',
  })
  const json = await callGraphApi<GraphListResponse<GraphCampaignRaw>>(url)
  if (json.error) throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  return (json.data ?? []).map(toCampaign)
}

export async function fetchAdSets(token: string, campaignId: string): Promise<readonly AdSet[]> {
  const url = buildUrl(`/${campaignId}/adsets`, token, {
    fields: 'id,name,status,effective_status',
    limit: '100',
  })
  const json = await callGraphApi<GraphListResponse<GraphAdSetRaw>>(url)
  if (json.error) throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  return (json.data ?? []).map(toAdSet)
}

export async function countActiveAdsInAccount(token: string, accountId: string): Promise<number> {
  const url = buildUrl(`/${accountId}/ads`, token, {
    filtering: JSON.stringify([
      { field: 'effective_status', operator: 'IN', value: ['ACTIVE'] },
    ]),
    summary: 'total_count',
    limit: '1',
    fields: 'id',
  })
  const json = await callGraphApi<GraphSummaryResponse>(url)
  if (json.error) {
    throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  }
  return json.summary?.total_count ?? 0
}

export async function fetchPages(token: string): Promise<readonly Page[]> {
  const url = buildUrl('/me/accounts', token, { fields: 'id,name', limit: '100' })
  const json = await callGraphApi<GraphListResponse<GraphPageRaw>>(url)
  if (json.error) throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  return (json.data ?? []).map((raw) => ({ id: raw.id, name: raw.name }))
}

export async function uploadImage(
  token: string,
  accountId: string,
  bytes: ArrayBuffer,
  filename: string,
  mimeType: string,
): Promise<{ hash: string }> {
  const form = new FormData()
  const blob = new Blob([bytes], { type: mimeType })
  form.append(filename, blob, filename)
  form.append('access_token', token)
  const json = await callGraphApiMultipart<GraphImageUploadResponse>(
    `/${accountId}/adimages`,
    form,
  )
  if (json.error) throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  const entry = json.images[filename]
  if (!entry) throw new Error('Meta API returned no image hash')
  return { hash: entry.hash }
}

export async function uploadVideo(
  token: string,
  accountId: string,
  bytes: ArrayBuffer,
  filename: string,
  mimeType: string,
): Promise<{ id: string }> {
  const form = new FormData()
  const blob = new Blob([bytes], { type: mimeType })
  form.append('source', blob, filename)
  form.append('title', filename)
  form.append('access_token', token)
  const json = await callGraphApiMultipart<GraphVideoUploadResponse>(
    `/${accountId}/advideos`,
    form,
  )
  if (json.error) throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  return { id: json.id }
}

export async function createAdCreative(token: string, params: AdCreativeParams): Promise<{ id: string }> {
  let storySpec: Record<string, unknown>

  if (params.imageHash) {
    storySpec = {
      page_id: params.pageId,
      link_data: {
        image_hash: params.imageHash,
        link: params.destinationUrl,
        message: params.bodyText,
        name: params.headline,
        call_to_action: {
          type: params.ctaType,
          value: { link: params.destinationUrl },
        },
      },
    }
  } else if (params.videoId) {
    storySpec = {
      page_id: params.pageId,
      video_data: {
        video_id: params.videoId,
        title: params.headline,
        message: params.bodyText,
        call_to_action: {
          type: params.ctaType,
          value: { link: params.destinationUrl },
        },
      },
    }
  } else {
    storySpec = {
      page_id: params.pageId,
      link_data: {
        link: params.destinationUrl,
        message: params.bodyText,
        name: params.headline,
        call_to_action: {
          type: params.ctaType,
          value: { link: params.destinationUrl },
        },
      },
    }
  }

  const body = new URLSearchParams({
    name: `Creative – ${params.headline}`,
    object_story_spec: JSON.stringify(storySpec),
    access_token: token,
  })

  const json = await callGraphApiPost<GraphCreativeResponse>(
    `/${params.accountId}/adcreatives`,
    body,
  )
  if (json.error) throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  return { id: json.id }
}

export async function createAd(
  token: string,
  accountId: string,
  adSetId: string,
  creativeId: string,
  name: string,
): Promise<{ id: string }> {
  const body = new URLSearchParams({
    name,
    adset_id: adSetId,
    creative: JSON.stringify({ creative_id: creativeId }),
    status: 'PAUSED',
    access_token: token,
  })
  const json = await callGraphApiPost<GraphAdResponse>(`/${accountId}/ads`, body)
  if (json.error) throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  return { id: json.id }
}

// ─── Insights ─────────────────────────────────────────────────────────────────

export interface InsightsTotals {
  readonly spend: number
  readonly revenue: number
  readonly purchases: number
  readonly impressions: number
  readonly clicks: number
}

export interface InsightsDailyPoint extends InsightsTotals {
  readonly date: string
}

export interface AccountInsights {
  readonly accountId: string
  readonly currency: string
  readonly totals: InsightsTotals
  readonly daily: readonly InsightsDailyPoint[]
}

export interface AdWithInsights {
  readonly id: string
  readonly name: string
  readonly status: string
  readonly effectiveStatus: string
  readonly creativeType: 'image' | 'video' | 'unknown'
  readonly thumbnailUrl: string | null
  readonly accountId: string
  readonly currency: string
  readonly insights: InsightsTotals
}

const INSIGHTS_FIELDS = 'spend,impressions,clicks,actions,action_values'

interface GraphAction {
  action_type: string
  value: string
}

interface GraphInsightsRow {
  date_start?: string
  date_stop?: string
  spend?: string
  impressions?: string
  clicks?: string
  actions?: GraphAction[]
  action_values?: GraphAction[]
}

interface GraphInsightsResponse {
  data?: GraphInsightsRow[]
  error?: { message: string; type: string; code: number }
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
  insights?: {
    data?: GraphInsightsRow[]
  }
}

interface GraphAdsListResponse {
  data?: GraphAdWithCreativeRaw[]
  error?: { message: string; type: string; code: number }
  paging?: { next?: string }
}

interface GraphAdInsightsRow {
  ad_id?: string
  spend?: string
  impressions?: string
  clicks?: string
  actions?: GraphAction[]
  action_values?: GraphAction[]
}

interface GraphAdInsightsResponse {
  data?: GraphAdInsightsRow[]
  error?: { message: string; type: string; code: number }
  paging?: { next?: string }
}

export interface AdInsightsFilter {
  readonly field: string
  readonly operator: 'GREATER_THAN' | 'LESS_THAN' | 'EQUAL' | 'IN'
  readonly value: number | string | readonly string[]
}

export async function fetchAccountInsights(
  token: string,
  accountId: string,
  currency: string,
  dateParams: Record<string, string>,
  options: { readonly daily: boolean } = { daily: true },
): Promise<AccountInsights> {
  const totalsParams = { fields: INSIGHTS_FIELDS, level: 'account', ...dateParams }
  const totals = sumInsightsRows(await fetchInsightsRows(token, accountId, totalsParams))

  let daily: readonly InsightsDailyPoint[] = []
  if (options.daily) {
    const dailyParams = { ...totalsParams, time_increment: '1' }
    const dailyRows = await fetchInsightsRows(token, accountId, dailyParams)
    daily = dailyRows.map(toDailyPoint)
  }

  return { accountId, currency, totals, daily }
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

const FILTERED_INSIGHTS_FIELDS = `ad_id,${INSIGHTS_FIELDS}`

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

const AD_METADATA_BATCH_SIZE = 50

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

async function fetchInsightsRows(
  token: string,
  accountId: string,
  params: Record<string, string>,
): Promise<readonly GraphInsightsRow[]> {
  const url = buildUrl(`/${accountId}/insights`, token, params)
  const json = await callGraphApi<GraphInsightsResponse>(url)
  if (json.error) {
    throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  }
  return json.data ?? []
}

function sumInsightsRows(rows: readonly GraphInsightsRow[]): InsightsTotals {
  return rows.reduce<InsightsTotals>(
    (acc, row) => {
      const r = rowToTotals(row)
      return {
        spend: acc.spend + r.spend,
        revenue: acc.revenue + r.revenue,
        purchases: acc.purchases + r.purchases,
        impressions: acc.impressions + r.impressions,
        clicks: acc.clicks + r.clicks,
      }
    },
    { spend: 0, revenue: 0, purchases: 0, impressions: 0, clicks: 0 },
  )
}

function rowToTotals(row: GraphInsightsRow): InsightsTotals {
  return {
    spend: parseNumber(row.spend),
    revenue: sumPurchaseActions(row.action_values),
    purchases: sumPurchaseActions(row.actions),
    impressions: parseNumber(row.impressions),
    clicks: parseNumber(row.clicks),
  }
}

function toDailyPoint(row: GraphInsightsRow): InsightsDailyPoint {
  const totals = rowToTotals(row)
  return { date: row.date_start ?? '', ...totals }
}

function sumPurchaseActions(actions: readonly GraphAction[] | undefined): number {
  if (!actions) {
    return 0
  }
  return actions.reduce((acc, a) => {
    if (a.action_type === PURCHASE_ACTION_TYPE) {
      return acc + parseNumber(a.value)
    }
    return acc
  }, 0)
}

// Meta convention: missing/non-numeric metric == 0.
function parseNumber(value: string | undefined): number {
  if (!value) {
    return 0
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

type CreativeType = 'image' | 'video' | 'unknown'

const OBJECT_TYPE_TO_CREATIVE: Record<string, CreativeType> = {
  VIDEO: 'video',
  IMAGE: 'image',
  PHOTO: 'image',
  SHARE: 'image',
}

function classifyCreativeType(creative: GraphAdWithCreativeRaw['creative']): CreativeType {
  if (!creative) {
    return 'unknown'
  }
  if (creative.video_id) {
    return 'video'
  }
  return creative.object_type ? OBJECT_TYPE_TO_CREATIVE[creative.object_type] ?? 'unknown' : 'unknown'
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function buildUrl(path: string, token: string, params: Record<string, string>): string {
  const qs = new URLSearchParams({ ...params, access_token: token })
  return `${GRAPH_API_BASE}${path}?${qs.toString()}`
}

async function callGraphApi<T>(url: string): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), LIST_FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      const body = await response.text().catch(() => '')
      const parsed = parseGraphApiError(body)
      throw new Error(parsed ?? `Graph API HTTP ${response.status}: ${response.statusText}`)
    }
    return response.json() as Promise<T>
  } finally {
    clearTimeout(timer)
  }
}

function parseGraphApiError(body: string): string | null {
  if (!body) return null
  try {
    const json = JSON.parse(body) as { error?: { code?: number; message?: string } }
    const err = json.error
    if (!err) return null
    if (err.code === 17) {
      return 'Meta is rate-limiting this ad account. Wait ~1-2 minutes and try again.'
    }
    if (err.message) {
      return err.code !== undefined ? `Meta API error ${err.code}: ${err.message}` : err.message
    }
    return null
  } catch {
    return null
  }
}

async function callGraphApiPost<T>(path: string, body: URLSearchParams): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), LIST_FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(`${GRAPH_API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: controller.signal,
    })
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Graph API HTTP ${response.status}: ${text}`)
    }
    return response.json() as Promise<T>
  } finally {
    clearTimeout(timer)
  }
}

async function callGraphApiMultipart<T>(path: string, form: FormData): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), UPLOAD_FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(`${GRAPH_API_BASE}${path}`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    })
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Graph API HTTP ${response.status}: ${text}`)
    }
    return response.json() as Promise<T>
  } finally {
    clearTimeout(timer)
  }
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function toAdAccount(raw: GraphAdAccountRaw): AdAccount {
  return {
    id: raw.id,
    name: raw.name,
    accountStatus: raw.account_status,
    currency: raw.currency,
    timezoneName: raw.timezone_name,
  }
}

function toCampaign(raw: GraphCampaignRaw): Campaign {
  return {
    id: raw.id,
    name: raw.name,
    status: raw.status,
    effectiveStatus: raw.effective_status,
  }
}

function toAdSet(raw: GraphAdSetRaw): AdSet {
  return {
    id: raw.id,
    name: raw.name,
    status: raw.status,
    effectiveStatus: raw.effective_status,
  }
}

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0'
const FETCH_TIMEOUT_MS = 30_000

const PURCHASE_ACTION_TYPES = new Set([
  'purchase',
  'omni_purchase',
  'offsite_conversion.fb_pixel_purchase',
  'web_in_store_purchase',
])

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
  options: { readonly limit?: number } = {},
): Promise<readonly AdWithInsights[]> {
  const limit = options.limit ?? 200
  const insightsSubfield = buildInsightsSubfield(dateParams)
  const fields = [
    'id',
    'name',
    'status',
    'effective_status',
    'creative{id,thumbnail_url,object_type,video_id}',
    insightsSubfield,
  ].join(',')

  const url = buildUrl(`/${accountId}/ads`, token, { fields, limit: String(limit) })
  const json = await callGraphApi<GraphAdsListResponse>(url)
  if (json.error) {
    throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  }
  return (json.data ?? []).map((raw) => toAdWithInsights(raw, accountId, currency))
}

function buildInsightsSubfield(dateParams: Record<string, string>): string {
  const fragments: string[] = []
  for (const [key, value] of Object.entries(dateParams)) {
    fragments.push(`${key}(${encodeFieldArg(value)})`)
  }
  const args = fragments.length > 0 ? `.${fragments.join('.')}` : ''
  return `insights${args}{${INSIGHTS_FIELDS}}`
}

function encodeFieldArg(value: string): string {
  return value.replaceAll(' ', '_')
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
    if (PURCHASE_ACTION_TYPES.has(a.action_type)) {
      return acc + parseNumber(a.value)
    }
    return acc
  }, 0)
}

function parseNumber(value: string | undefined): number {
  if (!value) {
    return 0
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function toAdWithInsights(
  raw: GraphAdWithCreativeRaw,
  accountId: string,
  currency: string,
): AdWithInsights {
  const insightsRow = raw.insights?.data?.[0]
  const insights = insightsRow
    ? rowToTotals(insightsRow)
    : { spend: 0, revenue: 0, purchases: 0, impressions: 0, clicks: 0 }
  return {
    id: raw.id,
    name: raw.name,
    status: raw.status,
    effectiveStatus: raw.effective_status,
    creativeType: classifyCreativeType(raw.creative),
    thumbnailUrl: raw.creative?.thumbnail_url ?? null,
    accountId,
    currency,
    insights,
  }
}

function classifyCreativeType(
  creative: GraphAdWithCreativeRaw['creative'],
): 'image' | 'video' | 'unknown' {
  if (!creative) {
    return 'unknown'
  }
  if (creative.video_id) {
    return 'video'
  }
  if (creative.object_type === 'VIDEO' || creative.object_type === 'SHARE') {
    return creative.object_type === 'VIDEO' ? 'video' : 'image'
  }
  if (creative.object_type === 'IMAGE' || creative.object_type === 'PHOTO') {
    return 'image'
  }
  return 'unknown'
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function buildUrl(path: string, token: string, params: Record<string, string>): string {
  const qs = new URLSearchParams({ ...params, access_token: token })
  return `${GRAPH_API_BASE}${path}?${qs.toString()}`
}

async function callGraphApi<T>(url: string): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`Graph API HTTP ${response.status}: ${response.statusText}`)
    }
    return response.json() as Promise<T>
  } finally {
    clearTimeout(timer)
  }
}

async function callGraphApiPost<T>(path: string, body: URLSearchParams): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
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
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
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

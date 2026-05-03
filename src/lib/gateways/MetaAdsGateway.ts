const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0'
const FETCH_TIMEOUT_MS = 10_000

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

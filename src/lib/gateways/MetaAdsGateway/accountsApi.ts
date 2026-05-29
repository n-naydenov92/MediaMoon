import { buildUrl, callGraphApi, callGraphApiPost } from './http'
import type { AdAccount, AdSet, Campaign, InstagramAccount, Page } from './types'

interface GraphListResponse<T> {
  data: T[]
  error?: { message: string; type: string; code: number }
}

interface GraphSummaryResponse {
  data?: unknown[]
  summary?: { total_count?: number }
  error?: { message: string; type: string; code: number }
}

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
  picture?: { data?: { url?: string } }
}

export async function fetchAdAccounts(token: string): Promise<readonly AdAccount[]> {
  const url = buildUrl('/me/adaccounts', token, {
    fields: 'id,name,account_status,currency,timezone_name',
    limit: '100',
  })
  const json = await callGraphApi<GraphListResponse<GraphAdAccountRaw>>(url)
  if (json.error) {
    throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  }
  return (json.data ?? []).map(toAdAccount)
}

export type StatusFilter = 'all' | 'active' | 'paused'

const CAMPAIGN_PAUSED_STATUSES = ['PAUSED', 'CAMPAIGN_PAUSED', 'ARCHIVED']
const ADSET_PAUSED_STATUSES = ['PAUSED', 'ADSET_PAUSED', 'CAMPAIGN_PAUSED', 'ARCHIVED']

function buildStatusParams(filter: StatusFilter, pausedValues: readonly string[]): Record<string, string> {
  if (filter === 'all') return {}
  const values = filter === 'active' ? ['ACTIVE'] : pausedValues
  return { effective_status: JSON.stringify(values) }
}

export async function fetchCampaigns(
  token: string,
  accountId: string,
  status: StatusFilter = 'all',
): Promise<readonly Campaign[]> {
  const url = buildUrl(`/${accountId}/campaigns`, token, {
    fields: 'id,name,status,effective_status',
    limit: '100',
    ...buildStatusParams(status, CAMPAIGN_PAUSED_STATUSES),
  })
  const json = await callGraphApi<GraphListResponse<GraphCampaignRaw>>(url)
  if (json.error) {
    throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  }
  return (json.data ?? []).map(toCampaign)
}

export async function fetchAdSets(
  token: string,
  campaignId: string,
  status: StatusFilter = 'all',
): Promise<readonly AdSet[]> {
  const url = buildUrl(`/${campaignId}/adsets`, token, {
    fields: 'id,name,status,effective_status',
    limit: '100',
    ...buildStatusParams(status, ADSET_PAUSED_STATUSES),
  })
  const json = await callGraphApi<GraphListResponse<GraphAdSetRaw>>(url)
  if (json.error) {
    throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  }
  return (json.data ?? []).map(toAdSet)
}

export async function fetchPages(token: string): Promise<readonly Page[]> {
  const url = buildUrl('/me/accounts', token, {
    fields: 'id,name,picture.type(normal){url}',
    limit: '100',
  })
  const json = await callGraphApi<GraphListResponse<GraphPageRaw>>(url)
  if (json.error) {
    throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  }
  return (json.data ?? []).map(toPage)
}

interface GraphInstagramAccountRaw {
  id: string
  username: string
  profile_picture_url?: string
}

interface GraphPageWithInstagramRaw {
  instagram_business_account?: GraphInstagramAccountRaw
  connected_instagram_account?: GraphInstagramAccountRaw
  error?: { message: string; type: string; code: number }
}

export async function fetchInstagramAccountsForPage(
  token: string,
  pageId: string,
): Promise<readonly InstagramAccount[]> {
  const url = buildUrl(`/${pageId}`, token, {
    fields: 'instagram_business_account{id,username,profile_picture_url},connected_instagram_account{id,username,profile_picture_url}',
  })
  const json = await callGraphApi<GraphPageWithInstagramRaw>(url)
  if (json.error) {
    throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  }
  const accounts: InstagramAccount[] = []
  if (json.instagram_business_account) {
    accounts.push({
      id: json.instagram_business_account.id,
      username: json.instagram_business_account.username,
      pictureUrl: json.instagram_business_account.profile_picture_url ?? null,
    })
  }
  if (
    json.connected_instagram_account
    && json.connected_instagram_account.id !== json.instagram_business_account?.id
  ) {
    accounts.push({
      id: json.connected_instagram_account.id,
      username: json.connected_instagram_account.username,
      pictureUrl: json.connected_instagram_account.profile_picture_url ?? null,
    })
  }
  return accounts
}

interface CopyAdSetResponse {
  copied_adset_id?: string
  copied_ad_set_id?: string
  error?: { code: number; message: string; is_transient?: boolean }
}

interface UpdateAdSetResponse {
  success?: boolean
  error?: { code: number; message: string; is_transient?: boolean }
}

async function postWithRetry<T extends { error?: { code: number; is_transient?: boolean } }>(
  path: string,
  body: URLSearchParams,
  attempts = 3,
): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i < attempts; i += 1) {
    try {
      const result = await callGraphApiPost<T>(path, body)
      if (!result.error || !result.error.is_transient) return result
      lastErr = new Error(`Meta API error ${result.error.code}: transient`)
    } catch (err) {
      lastErr = err
      const message = err instanceof Error ? err.message : ''
      if (!message.includes('transient') && !message.includes('HTTP 500') && !message.includes('HTTP 503')) {
        throw err
      }
    }
    if (i < attempts - 1) {
      await new Promise((resolve) => {
        setTimeout(resolve, 600 * (i + 1))
      })
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Meta API failed after retries')
}

export async function duplicateAdSet(
  token: string,
  adSetId: string,
  newName: string,
  status: 'PAUSED' | 'ACTIVE' = 'PAUSED',
  extraUpdateFields?: URLSearchParams,
): Promise<{ adSetId: string }> {
  const copyBody = new URLSearchParams({
    status_option: 'PAUSED',
    access_token: token,
  })
  // Move start_time/end_time from update payload to /copies body — Meta locks
  // start_time on the copy if it inherits from a source that already started.
  if (extraUpdateFields) {
    const inheritedStart = extraUpdateFields.get('start_time')
    if (inheritedStart) {
      copyBody.set('start_time', inheritedStart)
      extraUpdateFields.delete('start_time')
    }
    const inheritedEnd = extraUpdateFields.get('end_time')
    if (inheritedEnd) {
      copyBody.set('end_time', inheritedEnd)
      extraUpdateFields.delete('end_time')
    }
  }

  // eslint-disable-next-line no-console
  console.log('[duplicateAdSet COPY PAYLOAD]', Array.from(copyBody.entries()).filter(([k]) => k !== 'access_token'))

  const copyJson = await postWithRetry<CopyAdSetResponse>(`/${adSetId}/copies`, copyBody)
  if (copyJson.error) {
    throw new Error(`Meta API error ${copyJson.error.code}: ${copyJson.error.message}`)
  }
  const newId = copyJson.copied_adset_id ?? copyJson.copied_ad_set_id
  if (!newId) {
    throw new Error('Meta API did not return a copied ad set id')
  }

  const updateBody = new URLSearchParams({
    name: newName,
    access_token: token,
  })
  if (status === 'ACTIVE') {
    updateBody.set('status', 'ACTIVE')
  }
  if (extraUpdateFields) {
    extraUpdateFields.forEach((value, key) => {
      updateBody.set(key, value)
    })
  }

  // eslint-disable-next-line no-console
  console.log('[duplicateAdSet UPDATE PAYLOAD]', Array.from(updateBody.entries()).filter(([k]) => k !== 'access_token'))

  const renameJson = await postWithRetry<UpdateAdSetResponse>(`/${newId}`, updateBody)
  if (renameJson.error) {
    throw new Error(`Meta API error ${renameJson.error.code}: ${renameJson.error.message}`)
  }

  return { adSetId: newId }
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

function toPage(raw: GraphPageRaw): Page {
  return {
    id: raw.id,
    name: raw.name,
    pictureUrl: raw.picture?.data?.url ?? null,
  }
}

import { MetaApiError } from './graphErrors'
import { buildUrl, callGraphApi, callGraphApiPost } from './http'
import type { AdAccount, AdSet, Campaign, DsaEntities, InstagramAccount, Page } from './types'

const TRANSIENT_RETRY_ATTEMPTS = 3
const TRANSIENT_RETRY_BASE_DELAY_MS = 600

interface GraphListResponse<T> {
  data: T[]
}

interface GraphSummaryResponse {
  data?: unknown[]
  summary?: { total_count?: number }
}

interface GraphAdsVolumeResponse {
  data?: { ads_running_or_in_review_count?: number }[]
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
  objective?: string
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
    fields: 'id,name,status,effective_status,objective',
    limit: '100',
    ...buildStatusParams(status, CAMPAIGN_PAUSED_STATUSES),
  })
  const json = await callGraphApi<GraphListResponse<GraphCampaignRaw>>(url)
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
  return (json.data ?? []).map(toAdSet)
}

export async function fetchPages(token: string): Promise<readonly Page[]> {
  const url = buildUrl('/me/accounts', token, {
    fields: 'id,name,picture.type(normal){url}',
    limit: '100',
  })
  const json = await callGraphApi<GraphListResponse<GraphPageRaw>>(url)
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
}

export async function fetchInstagramAccountsForPage(
  token: string,
  pageId: string,
): Promise<readonly InstagramAccount[]> {
  const url = buildUrl(`/${pageId}`, token, {
    fields: 'instagram_business_account{id,username,profile_picture_url},connected_instagram_account{id,username,profile_picture_url}',
  })
  const json = await callGraphApi<GraphPageWithInstagramRaw>(url)
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
}

interface UpdateAdSetResponse {
  success?: boolean
}

interface CreateAdSetResponse {
  id?: string
}

async function postWithRetry<T>(path: string, body: URLSearchParams): Promise<T> {
  for (let attempt = 1; attempt < TRANSIENT_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await callGraphApiPost<T>(path, body)
    } catch (err) {
      if (!(err instanceof MetaApiError) || err.reason !== 'transient') {
        throw err
      }
      await new Promise((resolve) => {
        setTimeout(resolve, TRANSIENT_RETRY_BASE_DELAY_MS * attempt)
      })
    }
  }
  return callGraphApiPost<T>(path, body)
}

export async function createAdSet(
  token: string,
  accountId: string,
  fields: URLSearchParams,
): Promise<{ adSetId: string }> {
  const body = new URLSearchParams(fields)
  // Memory rule: every created Meta entity must be PAUSED — never ACTIVE on create.
  body.set('status', 'PAUSED')
  body.set('access_token', token)

  const json = await postWithRetry<CreateAdSetResponse>(`/${accountId}/adsets`, body)
  if (!json.id) {
    throw new Error('Meta API did not return a created ad set id')
  }
  return { adSetId: json.id }
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

  const copyJson = await postWithRetry<CopyAdSetResponse>(`/${adSetId}/copies`, copyBody)
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

  await postWithRetry<UpdateAdSetResponse>(`/${newId}`, updateBody)

  return { adSetId: newId }
}

interface GraphAdSetDsaRaw {
  dsa_beneficiary?: string
  dsa_payor?: string
}

// Meta does not expose the Business Manager DSA entity list via public Marketing
// API. Aggregating the account's existing ad-sets is the closest available
// signal — values that Meta has already accepted in this account, which mirrors
// what the Ads Manager dropdown shows for "previously used" entries.
export async function fetchDsaEntities(token: string, accountId: string): Promise<DsaEntities> {
  const url = buildUrl(`/${accountId}/adsets`, token, {
    fields: 'dsa_beneficiary,dsa_payor',
    limit: '200',
  })
  const json = await callGraphApi<GraphListResponse<GraphAdSetDsaRaw>>(url)
  const beneficiaries = new Set<string>()
  const payors = new Set<string>()
  for (const ad of json.data ?? []) {
    if (ad.dsa_beneficiary) beneficiaries.add(ad.dsa_beneficiary)
    if (ad.dsa_payor) payors.add(ad.dsa_payor)
  }
  const collator = new Intl.Collator(undefined, { sensitivity: 'base' })
  return {
    beneficiaries: [...beneficiaries].sort((a, b) => collator.compare(a, b)),
    payors: [...payors].sort((a, b) => collator.compare(a, b)),
  }
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
  return json.summary?.total_count ?? 0
}

// `ads_volume` is the count Meta weighs against the per-Page ad limit: ads running
// (ad + ad set + campaign active, schedule started) or in review/processing, summed
// across every ad account using the Page — paused uploads don't count. Queried per
// Page because the actor breakdown omits Pages with no running ads in `accountId`.
export async function countActiveAdsForPage(
  token: string,
  accountId: string,
  pageId: string,
): Promise<number> {
  const url = buildUrl(`/${accountId}/ads_volume`, token, {
    page_id: pageId,
    fields: 'ads_running_or_in_review_count',
  })
  const json = await callGraphApi<GraphAdsVolumeResponse>(url)
  return json.data?.[0]?.ads_running_or_in_review_count ?? 0
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
    objective: raw.objective ?? '',
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

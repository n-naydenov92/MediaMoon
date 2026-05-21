import { buildUrl, callGraphApi } from './http'
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

export async function fetchCampaigns(token: string, accountId: string): Promise<readonly Campaign[]> {
  const url = buildUrl(`/${accountId}/campaigns`, token, {
    fields: 'id,name,status,effective_status',
    limit: '100',
  })
  const json = await callGraphApi<GraphListResponse<GraphCampaignRaw>>(url)
  if (json.error) {
    throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  }
  return (json.data ?? []).map(toCampaign)
}

export async function fetchAdSets(token: string, campaignId: string): Promise<readonly AdSet[]> {
  const url = buildUrl(`/${campaignId}/adsets`, token, {
    fields: 'id,name,status,effective_status',
    limit: '100',
  })
  const json = await callGraphApi<GraphListResponse<GraphAdSetRaw>>(url)
  if (json.error) {
    throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  }
  return (json.data ?? []).map(toAdSet)
}

export async function fetchPages(token: string): Promise<readonly Page[]> {
  const url = buildUrl('/me/accounts', token, { fields: 'id,name', limit: '100' })
  const json = await callGraphApi<GraphListResponse<GraphPageRaw>>(url)
  if (json.error) {
    throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  }
  return (json.data ?? []).map(toPage)
}

interface GraphPageWithInstagramRaw {
  instagram_business_account?: { id: string; username: string }
  connected_instagram_account?: { id: string; username: string }
  error?: { message: string; type: string; code: number }
}

export async function fetchInstagramAccountsForPage(
  token: string,
  pageId: string,
): Promise<readonly InstagramAccount[]> {
  const url = buildUrl(`/${pageId}`, token, {
    fields: 'instagram_business_account{id,username},connected_instagram_account{id,username}',
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
    })
  }
  if (
    json.connected_instagram_account
    && json.connected_instagram_account.id !== json.instagram_business_account?.id
  ) {
    accounts.push({
      id: json.connected_instagram_account.id,
      username: json.connected_instagram_account.username,
    })
  }
  return accounts
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
  return { id: raw.id, name: raw.name }
}

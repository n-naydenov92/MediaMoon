'use client'

import { useCallback, useMemo, useState } from 'react'
import type { BrandId } from '@/config/brands'
import type {
  AdAccount,
  AdSet,
  Campaign,
  InstagramAccount,
  Page,
  StatusFilter,
} from '@/lib/gateways/MetaAdsGateway'
import { useAbortableFetch } from './useAbortableFetch'

export interface TargetingValue {
  readonly accountId: string
  readonly campaignId: string
  readonly adSetId: string
  readonly pageIds: readonly string[]
  readonly instagramId: string
}

export const EMPTY_TARGETING: TargetingValue = {
  accountId: '',
  campaignId: '',
  adSetId: '',
  pageIds: [],
  instagramId: '',
}

export interface TargetingData {
  readonly accounts: readonly AdAccount[]
  readonly campaigns: readonly Campaign[]
  readonly adSets: readonly AdSet[]
  readonly pages: readonly Page[]
  readonly instagramAccounts: readonly InstagramAccount[]
  readonly refetchAdSets: () => void
}

interface Input {
  readonly brandId: BrandId
  readonly allowedAccountIds: readonly string[]
  readonly accountId: string
  readonly campaignId: string
  readonly pageIds: readonly string[]
  readonly campaignStatus: StatusFilter
  readonly adSetStatus: StatusFilter
}

interface AccountsResponse { accounts: readonly AdAccount[] }
interface PagesResponse { pages: readonly Page[] }
interface CampaignsResponse { campaigns: readonly Campaign[] }
interface AdSetsResponse { adSets: readonly AdSet[] }
interface InstagramAccountsResponse { instagramAccounts: readonly InstagramAccount[] }

export function useTargetingData({
  brandId,
  allowedAccountIds,
  accountId,
  campaignId,
  pageIds,
  campaignStatus,
  adSetStatus,
}: Input): TargetingData {
  const singlePageId = pageIds.length === 1 ? pageIds[0] : ''

  const [adSetsRefetchKey, setAdSetsRefetchKey] = useState(0)
  const refetchAdSets = useCallback(() => setAdSetsRefetchKey((k) => k + 1), [])

  const accountsResp = useAbortableFetch<AccountsResponse>(
    `/api/meta-ads/accounts?brandId=${brandId}`,
  )
  const pagesResp = useAbortableFetch<PagesResponse>(
    `/api/meta-ads/pages?brandId=${brandId}`,
  )
  const campaignsResp = useAbortableFetch<CampaignsResponse>(
    accountId ? `/api/meta-ads/campaigns?accountId=${accountId}&status=${campaignStatus}` : null,
  )
  const adSetsResp = useAbortableFetch<AdSetsResponse>(
    accountId && campaignId
      ? `/api/meta-ads/adsets?accountId=${accountId}&campaignId=${campaignId}&status=${adSetStatus}&_r=${adSetsRefetchKey}`
      : null,
  )
  const igResp = useAbortableFetch<InstagramAccountsResponse>(
    accountId && singlePageId
      ? `/api/meta-ads/instagram-accounts?accountId=${accountId}&pageId=${singlePageId}`
      : null,
  )

  const accounts = useMemo(
    () => (accountsResp?.accounts ?? []).filter((a) => allowedAccountIds.includes(a.id)),
    [accountsResp, allowedAccountIds],
  )
  const pages = pagesResp?.pages ?? []
  const campaigns = campaignsResp?.campaigns ?? []
  const adSets = adSetsResp?.adSets ?? []
  const instagramAccounts = igResp?.instagramAccounts ?? []

  return { accounts, campaigns, adSets, pages, instagramAccounts, refetchAdSets }
}

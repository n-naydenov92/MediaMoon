'use client'

import { useCallback, useMemo, useState } from 'react'
import type { BrandId } from '@/config/brands'
import type {
  AdAccount,
  AdSet,
  Campaign,
  DsaEntities,
  InstagramAccount,
  Page,
  StatusFilter,
} from '@/lib/gateways/MetaAdsGateway'
import { useAbortableFetch } from './useAbortableFetch'

const EMPTY_DSA_ENTITIES: DsaEntities = { beneficiaries: [], payors: [] }
const META_ASSETS_CACHE_URL = '/api/meta-ads/cache'

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
  readonly dsaEntities: DsaEntities
  readonly refetchAdSets: () => void
  // Clears the server cache of accounts / Pages / Instagram / pixels / DSA, then
  // reloads the lists shown here.
  readonly reloadAssets: () => void
  readonly isReloadingAssets: boolean
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
interface DsaEntitiesResponse { dsaEntities: DsaEntities }

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
  // Part of the cached lists' URLs below (the routes ignore it), so bumping it refetches them.
  const [assetsReloadKey, setAssetsReloadKey] = useState(0)
  const [isReloadingAssets, setIsReloadingAssets] = useState(false)

  const reloadAssets = useCallback((): void => {
    setIsReloadingAssets(true)
    void (async () => {
      try {
        const response = await fetch(META_ASSETS_CACHE_URL, { method: 'DELETE' })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        setAssetsReloadKey((k) => k + 1)
      } catch (err) {
        // eslint-disable-next-line no-console -- intentional logging at fetch boundary
        console.error('[useTargetingData] reload from Meta failed', err)
      } finally {
        setIsReloadingAssets(false)
      }
    })()
  }, [])

  const accountsResp = useAbortableFetch<AccountsResponse>(
    `/api/meta-ads/accounts?brandId=${brandId}&_r=${assetsReloadKey}`,
  )
  const pagesResp = useAbortableFetch<PagesResponse>(
    `/api/meta-ads/pages?brandId=${brandId}&_r=${assetsReloadKey}`,
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
      ? `/api/meta-ads/instagram-accounts?accountId=${accountId}&pageId=${singlePageId}&_r=${assetsReloadKey}`
      : null,
  )
  const dsaResp = useAbortableFetch<DsaEntitiesResponse>(
    accountId ? `/api/meta-ads/dsa-entities?accountId=${accountId}&_r=${assetsReloadKey}` : null,
  )

  const accounts = useMemo(
    () => (accountsResp?.accounts ?? []).filter((a) => allowedAccountIds.includes(a.id)),
    [accountsResp, allowedAccountIds],
  )
  const pages = pagesResp?.pages ?? []
  const campaigns = campaignsResp?.campaigns ?? []
  const adSets = adSetsResp?.adSets ?? []
  const instagramAccounts = igResp?.instagramAccounts ?? []
  const dsaEntities = dsaResp?.dsaEntities ?? EMPTY_DSA_ENTITIES

  return {
    accounts,
    campaigns,
    adSets,
    pages,
    instagramAccounts,
    dsaEntities,
    refetchAdSets,
    reloadAssets,
    isReloadingAssets,
  }
}

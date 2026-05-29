'use client'

import { useCallback, useEffect, useState } from 'react'
import type { BrandId } from '@/config/brands'
import type {
  AdAccount,
  AdSet,
  Campaign,
  InstagramAccount,
  Page,
  StatusFilter,
} from '@/lib/gateways/MetaAdsGateway'

export interface TargetingValue {
  readonly accountId: string
  readonly campaignId: string
  readonly adSetId: string
  readonly pageIds: readonly string[]
  readonly instagramId: string
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
  const [accounts, setAccounts] = useState<readonly AdAccount[]>([])
  const [campaigns, setCampaigns] = useState<readonly Campaign[]>([])
  const [adSets, setAdSets] = useState<readonly AdSet[]>([])
  const [pages, setPages] = useState<readonly Page[]>([])
  const [instagramAccounts, setInstagramAccounts] = useState<readonly InstagramAccount[]>([])
  const [adSetsRefetchKey, setAdSetsRefetchKey] = useState(0)
  const refetchAdSets = useCallback(() => setAdSetsRefetchKey((k) => k + 1), [])

  useEffect(() => {
    const ctrl = new AbortController()
    void (async () => {
      try {
        const [accountsRes, pagesRes] = await Promise.all([
          fetch(`/api/meta-ads/accounts?brandId=${brandId}`, { signal: ctrl.signal }),
          fetch(`/api/meta-ads/pages?brandId=${brandId}`, { signal: ctrl.signal }),
        ])
        if (accountsRes.ok) {
          const { accounts: data } = (await accountsRes.json()) as { accounts: readonly AdAccount[] }
          if (!ctrl.signal.aborted) {
            setAccounts(data.filter((a) => allowedAccountIds.includes(a.id)))
          }
        }
        if (pagesRes.ok) {
          const { pages: data } = (await pagesRes.json()) as { pages: readonly Page[] }
          if (!ctrl.signal.aborted) {
            setPages(data)
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }
        // eslint-disable-next-line no-console -- intentional logging
        console.error(err)
      }
    })()
    return () => ctrl.abort()
  }, [brandId, allowedAccountIds])

  useEffect(() => {
    if (!accountId) {
      setCampaigns([])
      return
    }
    const ctrl = new AbortController()
    void (async () => {
      try {
        const response = await fetch(
          `/api/meta-ads/campaigns?accountId=${accountId}&status=${campaignStatus}`,
          { signal: ctrl.signal },
        )
        if (!response.ok) {
          return
        }
        const { campaigns: data } = (await response.json()) as { campaigns: readonly Campaign[] }
        if (!ctrl.signal.aborted) {
          setCampaigns(data)
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }
        throw err
      }
    })()
    return () => ctrl.abort()
  }, [accountId, campaignStatus])

  useEffect(() => {
    if (!accountId || !singlePageId) {
      setInstagramAccounts([])
      return
    }
    const ctrl = new AbortController()
    void (async () => {
      try {
        const response = await fetch(
          `/api/meta-ads/instagram-accounts?accountId=${accountId}&pageId=${singlePageId}`,
          { signal: ctrl.signal },
        )
        if (!response.ok) {
          return
        }
        const { instagramAccounts: data } = (await response.json()) as {
          instagramAccounts: readonly InstagramAccount[]
        }
        if (!ctrl.signal.aborted) {
          setInstagramAccounts(data)
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }
        throw err
      }
    })()
    return () => ctrl.abort()
  }, [accountId, singlePageId])

  useEffect(() => {
    if (!accountId || !campaignId) {
      setAdSets([])
      return
    }
    const ctrl = new AbortController()
    void (async () => {
      try {
        const response = await fetch(
          `/api/meta-ads/adsets?accountId=${accountId}&campaignId=${campaignId}&status=${adSetStatus}`,
          { signal: ctrl.signal },
        )
        if (!response.ok) {
          return
        }
        const { adSets: data } = (await response.json()) as { adSets: readonly AdSet[] }
        if (!ctrl.signal.aborted) {
          setAdSets(data)
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }
        throw err
      }
    })()
    return () => ctrl.abort()
  }, [accountId, campaignId, adSetStatus, adSetsRefetchKey])

  return { accounts, campaigns, adSets, pages, instagramAccounts, refetchAdSets }
}

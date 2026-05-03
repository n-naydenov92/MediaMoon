'use client'

import { useEffect, useState } from 'react'
import type { BrandId } from '@/config/brands'
import type { AdAccount, AdSet, Campaign, Page } from '@/lib/gateways/MetaAdsGateway'
import FormField from './FormField'
import styles from './TargetingForm.module.css'

export interface TargetingValue {
  readonly accountId: string
  readonly campaignId: string
  readonly adSetId: string
  readonly pageId: string
}

interface Props {
  readonly brandId: BrandId
  readonly allowedAccountIds: readonly string[]
  readonly value: TargetingValue
  readonly onChange: (next: TargetingValue) => void
}

export default function TargetingForm({
  brandId,
  allowedAccountIds,
  value,
  onChange,
}: Props): JSX.Element {
  const [accounts, setAccounts] = useState<readonly AdAccount[]>([])
  const [campaigns, setCampaigns] = useState<readonly Campaign[]>([])
  const [adSets, setAdSets] = useState<readonly AdSet[]>([])
  const [pages, setPages] = useState<readonly Page[]>([])

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
        console.error(err)
      }
    })()
    return () => ctrl.abort()
  }, [brandId, allowedAccountIds])

  useEffect(() => {
    if (!value.accountId) {
      setCampaigns([])
      return
    }
    const ctrl = new AbortController()
    void (async () => {
      try {
        const response = await fetch(
          `/api/meta-ads/campaigns?accountId=${value.accountId}`,
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
  }, [value.accountId])

  useEffect(() => {
    if (!value.campaignId) {
      setAdSets([])
      return
    }
    const ctrl = new AbortController()
    void (async () => {
      try {
        const response = await fetch(
          `/api/meta-ads/adsets?brandId=${brandId}&campaignId=${value.campaignId}`,
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
  }, [brandId, value.campaignId])

  return (
    <div className={styles.grid}>
      <FormField label="Ad account">
        <select
          className={styles.select}
          value={value.accountId}
          onChange={(e) => onChange({ ...value, accountId: e.target.value, campaignId: '', adSetId: '' })}
        >
          <option value="">Select account…</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </FormField>

      <FormField label="Campaign">
        <select
          className={styles.select}
          value={value.campaignId}
          onChange={(e) => onChange({ ...value, campaignId: e.target.value, adSetId: '' })}
          disabled={!value.accountId || campaigns.length === 0}
        >
          <option value="">Select campaign…</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </FormField>

      <FormField label="Ad set">
        <select
          className={styles.select}
          value={value.adSetId}
          onChange={(e) => onChange({ ...value, adSetId: e.target.value })}
          disabled={!value.campaignId || adSets.length === 0}
        >
          <option value="">Select ad set…</option>
          {adSets.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </FormField>

      <FormField label="Facebook page">
        <select
          className={styles.select}
          value={value.pageId}
          onChange={(e) => onChange({ ...value, pageId: e.target.value })}
          disabled={pages.length === 0}
        >
          <option value="">Select page…</option>
          {pages.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </FormField>
    </div>
  )
}


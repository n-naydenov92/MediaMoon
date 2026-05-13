'use client'

import { useEffect, useState } from 'react'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
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

const SELECT_PROPS = {
  displayEmpty: true,
  MenuProps: {
    slotProps: { paper: { className: styles.menuPaper } },
    MenuListProps: { className: styles.menuList },
  },
} as const

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
        <TextField
          select
          size="small"
          variant="outlined"
          fullWidth
          className={styles.select}
          value={value.accountId}
          SelectProps={SELECT_PROPS}
          onChange={(e) => onChange({ ...value, accountId: e.target.value, campaignId: '', adSetId: '' })}
        >
          <MenuItem value="">Select account…</MenuItem>
          {accounts.map((a) => (
            <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
          ))}
        </TextField>
      </FormField>

      <FormField label="Campaign">
        <TextField
          select
          size="small"
          variant="outlined"
          fullWidth
          className={styles.select}
          value={value.campaignId}
          SelectProps={SELECT_PROPS}
          disabled={!value.accountId || campaigns.length === 0}
          onChange={(e) => onChange({ ...value, campaignId: e.target.value, adSetId: '' })}
        >
          <MenuItem value="">Select campaign…</MenuItem>
          {campaigns.map((c) => (
            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
          ))}
        </TextField>
      </FormField>

      <FormField label="Ad set">
        <TextField
          select
          size="small"
          variant="outlined"
          fullWidth
          className={styles.select}
          value={value.adSetId}
          SelectProps={SELECT_PROPS}
          disabled={!value.campaignId || adSets.length === 0}
          onChange={(e) => onChange({ ...value, adSetId: e.target.value })}
        >
          <MenuItem value="">Select ad set…</MenuItem>
          {adSets.map((a) => (
            <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
          ))}
        </TextField>
      </FormField>

      <FormField label="Facebook page">
        <TextField
          select
          size="small"
          variant="outlined"
          fullWidth
          className={styles.select}
          value={value.pageId}
          SelectProps={SELECT_PROPS}
          disabled={pages.length === 0}
          onChange={(e) => onChange({ ...value, pageId: e.target.value })}
        >
          <MenuItem value="">Select page…</MenuItem>
          {pages.map((p) => (
            <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
          ))}
        </TextField>
      </FormField>
    </div>
  )
}

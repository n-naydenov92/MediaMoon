'use client'

import { useCallback, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import type { BrandId } from '@/config/brands'
import type { Market } from '@/types'
import { useBrandShellContext } from '@/contexts/brandShell/useBrandShellContext'
import { ALL_MARKETS } from '@/lib/markets'
import { findBrandById } from '@/config/brands'
import { getAdAccountIds } from '@/config/adAccounts'
import Notice from '../../Notice/Notice'
import Section from '../../shared/Section/Section'
import FilePicker from './FilePicker/FilePicker'
import TargetingForm, { type TargetingValue } from './TargetingForm/TargetingForm'
import CopyForm, { type CopyValue } from './CopyForm/CopyForm'
import QueuePanel from './QueuePanel/QueuePanel'
import { useLaunchQueue } from '../useLaunchQueue'
import styles from './LaunchAdsTab.module.css'

interface Props {
  readonly brandId: BrandId
}

const EMPTY_COPY: CopyValue = { name: '', headline: '', body: '', url: '', cta: 'SHOP_NOW' }
const EMPTY_TARGETING: TargetingValue = {
  accountId: '',
  campaignId: '',
  adSetId: '',
  pageId: '',
  instagramId: '',
}

export default function LaunchAdsTab({ brandId }: Props): JSX.Element {
  const brand = findBrandById(brandId)
  const { selectedMarket } = useBrandShellContext()
  const [files, setFiles] = useState<readonly File[]>([])
  const [targeting, setTargeting] = useState<TargetingValue>(EMPTY_TARGETING)
  const [copy, setCopy] = useState<CopyValue>(EMPTY_COPY)
  const queue = useLaunchQueue()

  const targetMarket = useMemo<Market | null>(() => {
    if (!brand) {
      return null
    }
    if (selectedMarket !== ALL_MARKETS) {
      return selectedMarket
    }
    return brand.markets[0] ?? null
  }, [brand, selectedMarket])

  const allowedAccountIds = useMemo(
    () => (targetMarket ? getAdAccountIds(brandId, targetMarket) : []),
    [brandId, targetMarket],
  )

  const canSubmit =
    files.length > 0
    && targeting.accountId !== ''
    && targeting.campaignId !== ''
    && targeting.adSetId !== ''
    && targeting.pageId !== ''
    && copy.name !== ''
    && copy.headline !== ''
    && copy.body !== ''
    && copy.url !== ''

  const handleSubmit = useCallback(() => {
    if (!canSubmit || !targetMarket) {
      return
    }
    const payload = {
      accountId: targeting.accountId,
      adSetId: targeting.adSetId,
      pageId: targeting.pageId,
      instagramId: targeting.instagramId,
      copy,
    }
    for (const file of files) {
      queue.enqueue(payload, file)
    }
    setFiles([])
  }, [canSubmit, copy, files, queue, targeting, targetMarket])

  if (!brand || !targetMarket) {
    return (
      <Box component="section" className={styles.root}>
        <Notice variant="error" title="Unknown brand">
          This brand is not configured.
        </Notice>
      </Box>
    )
  }

  if (allowedAccountIds.length === 0) {
    return (
      <Box component="section" className={styles.root}>
        <Notice variant="info" title="No ad accounts mapped">
          Map at least one ad account for {brand.label} {targetMarket} in
          {' '}<Typography component="code" variant="inherit">BRAND_MARKET_AD_ACCOUNTS</Typography> before launching ads.
        </Notice>
      </Box>
    )
  }

  return (
    <Box component="section" className={styles.root}>
      <Section title="Step 1 — Pick creatives">
        <FilePicker files={files} onChange={setFiles} disabled={false} />
      </Section>

      <Section title="Step 2 — Targeting">
        <TargetingForm
          brandId={brandId}
          allowedAccountIds={allowedAccountIds}
          value={targeting}
          onChange={setTargeting}
        />
      </Section>

      <Section title="Step 3 — Copy (applies to every picked creative)">
        <CopyForm value={copy} onChange={setCopy} />
      </Section>

      <Box className={styles.actions}>
        <Button
          type="button"
          variant="contained"
          disableElevation
          className={styles.publish}
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {`▶ Publish ${files.length || ''} ${files.length === 1 ? 'ad' : 'ads'}`.trim()}
        </Button>
      </Box>

      <Section title="Queue">
        <QueuePanel
          jobs={queue.jobs}
          accountId={targeting.accountId}
          onRetry={queue.retry}
          onDismiss={queue.dismiss}
        />
      </Section>
    </Box>
  )
}

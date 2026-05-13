'use client'

import { useCallback, useMemo, useState } from 'react'
import Button from '@mui/material/Button'
import { CtaType } from '@prisma/client'
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
import JobsPanel from './JobsPanel/JobsPanel'
import UploadHistory from './UploadHistory/UploadHistory'
import { useLaunchJobs } from '../useLaunchJobs'
import styles from './LaunchAdsTab.module.css'

interface Props {
  readonly brandId: BrandId
}

const EMPTY_COPY: CopyValue = { headline: '', body: '', url: '', cta: CtaType.SHOP_NOW }
const EMPTY_TARGETING: TargetingValue = { accountId: '', campaignId: '', adSetId: '', pageId: '' }

export default function LaunchAdsTab({ brandId }: Props): JSX.Element {
  const brand = findBrandById(brandId)
  const { selectedMarket } = useBrandShellContext()
  const [files, setFiles] = useState<readonly File[]>([])
  const [targeting, setTargeting] = useState<TargetingValue>(EMPTY_TARGETING)
  const [copy, setCopy] = useState<CopyValue>(EMPTY_COPY)
  const launch = useLaunchJobs(brandId)

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
    files.length > 0 &&
    targeting.accountId !== '' &&
    targeting.campaignId !== '' &&
    targeting.adSetId !== '' &&
    targeting.pageId !== '' &&
    copy.headline !== '' &&
    copy.body !== '' &&
    copy.url !== '' &&
    launch.state.status !== 'creating'

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !targetMarket) {
      return
    }
    const result = await launch.createAndStartJob({
      brandId,
      market: targetMarket,
      accountId: targeting.accountId,
      campaignId: targeting.campaignId,
      adSetId: targeting.adSetId,
      pageId: targeting.pageId,
      copy,
      files,
    })
    if (result.ok) {
      setFiles([])
      setCopy(EMPTY_COPY)
    }
  }, [brandId, canSubmit, copy, files, launch, targeting, targetMarket])

  if (!brand || !targetMarket) {
    return (
      <section className={styles.root}>
        <Notice variant="error" title="Unknown brand">
          This brand is not configured.
        </Notice>
      </section>
    )
  }

  if (allowedAccountIds.length === 0) {
    return (
      <section className={styles.root}>
        <Notice variant="info" title="No ad accounts mapped">
          Map at least one ad account for {brand.label} {targetMarket} in
          {' '}<code>BRAND_MARKET_AD_ACCOUNTS</code> before launching ads.
        </Notice>
      </section>
    )
  }

  return (
    <section className={styles.root}>
      {launch.state.status === 'error' && (
        <Notice variant="error" title="Couldn't create the batch">
          {launch.state.message}
        </Notice>
      )}

      <Section title="Step 1 — Pick creatives">
        <FilePicker files={files} onChange={setFiles} disabled={launch.state.status === 'creating'} />
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

      <div className={styles.actions}>
        <Button
          type="button"
          variant="contained"
          disableElevation
          className={styles.publish}
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {launch.state.status === 'creating'
            ? 'Uploading…'
            : `▶ Publish ${files.length || ''} ${files.length === 1 ? 'ad' : 'ads'}`.trim()}
        </Button>
      </div>

      <Section title="Active jobs">
        <JobsPanel
          jobs={launch.jobs}
          clientProgress={launch.clientProgress}
          onCancel={launch.cancelJob}
        />
      </Section>

      <Section title="Recently uploaded">
        <UploadHistory brandId={brandId} />
      </Section>
    </section>
  )
}

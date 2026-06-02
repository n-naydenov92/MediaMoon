'use client'

import { useCallback, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { BrandId } from '@/config/brands'
import type { Market } from '@/types'
import { useBrandShellContext } from '@/contexts/brandShell/useBrandShellContext'
import { ALL_MARKETS } from '@/lib/markets'
import { findBrandById } from '@/config/brands'
import { getAdAccountIds } from '@/config/adAccounts'
import Notice from '../../Notice/Notice'
import CreatorPane from './CreatorPane/CreatorPane'
import LibraryPane from './LibraryPane/LibraryPane'
import { EMPTY_COPY, type CopyValue } from './CopyForm/CopyForm'
import { isValidDestinationUrl } from './CopyForm/helpers'
import { EMPTY_TARGETING, type TargetingValue } from './CreatorPane/useTargetingData'
import { useLaunchQueue } from './useLaunchQueue'
import styles from './AdsCreatorTab.module.css'

interface Props {
  readonly brandId: BrandId
}

export default function AdsCreatorTab({ brandId }: Props): JSX.Element {
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
    && targeting.pageIds.length > 0
    && copy.name !== ''
    && copy.headlines[0] !== ''
    && copy.primaryTexts[0] !== ''
    && isValidDestinationUrl(copy.url)

  const handleSubmit = useCallback(() => {
    if (!canSubmit || !targetMarket) {
      return
    }
    const headline = copy.headlines[0]
    const body = copy.primaryTexts[0]
    if (!headline || !body) {
      return
    }
    const isSinglePage = targeting.pageIds.length === 1
    const copyBlock = {
      name: copy.name,
      headline,
      body,
      description: copy.description,
      url: copy.url,
      cta: copy.cta,
    }
    for (const pageId of targeting.pageIds) {
      const payload = {
        accountId: targeting.accountId,
        adSetId: targeting.adSetId,
        pageId,
        instagramId: isSinglePage ? targeting.instagramId : '',
        autoResolveInstagram: !isSinglePage,
        copy: copyBlock,
      }
      for (const file of files) {
        queue.enqueue(payload, file)
      }
    }
    setFiles([])
  }, [canSubmit, copy, files, queue, targeting, targetMarket])

  if (!brand || !targetMarket) {
    return (
      <Box component="section" className={styles.rootFallback}>
        <Notice variant="error" title="Unknown brand">
          This brand is not configured.
        </Notice>
      </Box>
    )
  }

  if (allowedAccountIds.length === 0) {
    return (
      <Box component="section" className={styles.rootFallback}>
        <Notice variant="info" title="No ad accounts mapped">
          Map at least one ad account for {brand.label} {targetMarket} in
          {' '}<Typography component="code" variant="inherit">BRAND_MARKET_AD_ACCOUNTS</Typography> before launching ads.
        </Notice>
      </Box>
    )
  }

  return (
    <Box component="section" className={styles.root}>
      <CreatorPane
        brandId={brandId}
        allowedAccountIds={allowedAccountIds}
        targeting={targeting}
        onTargetingChange={setTargeting}
        files={files}
        onFilesChange={setFiles}
        copy={copy}
        onCopyChange={setCopy}
        jobs={queue.jobs}
        onRetry={queue.retry}
        onDismiss={queue.dismiss}
        canSubmit={canSubmit}
        onSubmit={handleSubmit}
      />
      <LibraryPane />
    </Box>
  )
}

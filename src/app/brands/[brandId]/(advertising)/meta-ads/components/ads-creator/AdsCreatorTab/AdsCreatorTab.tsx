'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { adNameMapKey } from './CreatorPane/helpers'
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
  const [adNames, setAdNames] = useState<ReadonlyMap<string, string>>(() => new Map())
  const [pageTokens, setPageTokens] = useState<ReadonlyMap<string, string>>(() => new Map())
  const queue = useLaunchQueue()

  // Drop custom page tokens for pages no longer selected.
  useEffect(() => {
    setPageTokens((prev) => {
      if (prev.size === 0) {
        return prev
      }
      const valid = new Set(targeting.pageIds)
      const next = new Map<string, string>()
      for (const [key, value] of prev) {
        if (valid.has(key)) {
          next.set(key, value)
        }
      }
      return next.size === prev.size ? prev : next
    })
  }, [targeting.pageIds])

  // Keep per-ad naming in sync with the current pages × files — drop entries for
  // ads no longer present (file removed or page deselected) so stale names never
  // leak into a later submit.
  useEffect(() => {
    setAdNames((prev) => {
      if (prev.size === 0) {
        return prev
      }
      const valid = new Set<string>()
      for (const pageId of targeting.pageIds) {
        for (const file of files) {
          valid.add(adNameMapKey(pageId, file))
        }
      }
      const next = new Map<string, string>()
      for (const [key, value] of prev) {
        if (valid.has(key)) {
          next.set(key, value)
        }
      }
      return next.size === prev.size ? prev : next
    })
  }, [files, targeting.pageIds])

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
    && (targeting.pageIds.length * files.length >= 2 || copy.name !== '')
    && copy.headlines[0] !== ''
    && copy.primaryTexts[0] !== ''
    && isValidDestinationUrl(copy.url)

  const handleSubmit = useCallback((resolvedNames: ReadonlyMap<string, string>) => {
    if (!canSubmit || !targetMarket) {
      return
    }
    const headline = copy.headlines[0]
    const body = copy.primaryTexts[0]
    if (!headline || !body) {
      return
    }
    const isSinglePage = targeting.pageIds.length === 1
    const batchId = crypto.randomUUID()
    const baseCopy = {
      headline,
      body,
      description: copy.description,
      url: copy.url,
      cta: copy.cta,
    }
    for (const pageId of targeting.pageIds) {
      for (const file of files) {
        const resolved = resolvedNames.get(adNameMapKey(pageId, file))
        const name = resolved || copy.name || file.name
        const payload = {
          accountId: targeting.accountId,
          adSetId: targeting.adSetId,
          pageId,
          instagramId: isSinglePage ? targeting.instagramId : '',
          autoResolveInstagram: !isSinglePage,
          status: copy.activate ? ('ACTIVE' as const) : ('PAUSED' as const),
          copy: { name, ...baseCopy },
        }
        queue.enqueue(payload, file, batchId)
      }
    }
    setFiles([])
    setAdNames(new Map())
    setPageTokens(new Map())
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
        adNames={adNames}
        onAdNamesChange={setAdNames}
        pageTokens={pageTokens}
        onPageTokensChange={setPageTokens}
        jobs={queue.jobs}
        onRetry={queue.retry}
        onStop={queue.stop}
        onDismiss={queue.dismiss}
        onAdSetCreated={queue.recordAdSet}
        canSubmit={canSubmit}
        onSubmit={handleSubmit}
      />
      <LibraryPane />
    </Box>
  )
}

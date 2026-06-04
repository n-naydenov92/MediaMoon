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
import { addTextVariation } from './CopyForm/VariationList/helpers'
import { EMPTY_COPY, type CopyValue } from './CopyForm/CopyForm'
import { addAsset, type AssetCreative } from './assetCreative'
import { EMPTY_TARGETING, type TargetingValue } from './CreatorPane/useTargetingData'
import {
  adKeyCombos,
  adNameMapKey,
  buildPublishPayload,
  canSubmitCreator,
} from './CreatorPane/helpers'
import { useLaunchQueue } from './useLaunchQueue'
import styles from './AdsCreatorTab.module.css'

interface Props {
  readonly brandId: BrandId
}

export default function AdsCreatorTab({ brandId }: Props): JSX.Element {
  const brand = findBrandById(brandId)
  const { selectedMarket } = useBrandShellContext()
  const [files, setFiles] = useState<readonly File[]>([])
  const [assets, setAssets] = useState<readonly AssetCreative[]>([])
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

  const creativeCount = files.length + assets.length
  const canSubmit = canSubmitCreator(targeting, copy, creativeCount)

  const handleAddPrimaryText = useCallback((value: string) => {
    setCopy((prev) => ({ ...prev, primaryTexts: addTextVariation(prev.primaryTexts, value) }))
  }, [])

  const handleAddHeadline = useCallback((value: string) => {
    setCopy((prev) => ({ ...prev, headlines: addTextVariation(prev.headlines, value) }))
  }, [])

  const handleAddUrl = useCallback((value: string) => {
    setCopy((prev) => ({ ...prev, url: value }))
  }, [])

  const handleAddCreative = useCallback((asset: AssetCreative) => {
    setAssets((prev) => addAsset(prev, asset))
  }, [])

  const addedAssetKeys = useMemo(() => new Set(assets.map((a) => a.assetKey)), [assets])

  const handleSubmit = useCallback((resolvedNames: ReadonlyMap<string, string>) => {
    if (!canSubmit || !targetMarket || !copy.headlines[0] || !copy.primaryTexts[0]) {
      return
    }
    const isSinglePage = targeting.pageIds.length === 1
    const isSingleAd = targeting.pageIds.length * (files.length + assets.length) === 1
    const batchId = crypto.randomUUID()
    for (const { pageId, file, key } of adKeyCombos(targeting.pageIds, files)) {
      const name = resolvedNames.get(key) || copy.name || file.name
      queue.enqueue(buildPublishPayload({ targeting, copy, pageId, name, isSinglePage }), file, batchId)
    }
    for (const pageId of targeting.pageIds) {
      for (const asset of assets) {
        const name = (isSingleAd ? copy.name.trim() : '') || asset.name
        queue.enqueueAsset(buildPublishPayload({ targeting, copy, pageId, name, isSinglePage }), asset, batchId)
      }
    }
    setFiles([])
    setAssets([])
    setAdNames(new Map())
    setPageTokens(new Map())
  }, [assets, canSubmit, copy, files, queue, targeting, targetMarket])

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
        assets={assets}
        onAssetsChange={setAssets}
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
      <LibraryPane
        brandId={brandId}
        market={selectedMarket}
        primaryTexts={copy.primaryTexts}
        headlines={copy.headlines}
        url={copy.url}
        addedAssetKeys={addedAssetKeys}
        onAddPrimaryText={handleAddPrimaryText}
        onAddHeadline={handleAddHeadline}
        onAddUrl={handleAddUrl}
        onAddCreative={handleAddCreative}
      />
    </Box>
  )
}

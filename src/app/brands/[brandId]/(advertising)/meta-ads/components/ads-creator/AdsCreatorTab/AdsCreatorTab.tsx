'use client'

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
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
import DecisionDialog from './DecisionDialog/DecisionDialog'
import { applyLibraryText } from './CopyForm/VariationList/helpers'
import { MAX_COPY_VARIATIONS } from './copyFeatureFlags'
import { EMPTY_COPY, type CopyValue } from './CopyForm/CopyForm'
import { addAsset, type AssetCreative } from './assetCreative'
import {
  clearFieldOverrides,
  countEmptyRequired,
  creativeKey,
  overrideCount,
  resolveCopy,
  type CopyOverride,
  type OverridableField,
} from './perCreativeCopy'
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
  const [copyOverrides, setCopyOverrides] = useState<ReadonlyMap<string, CopyOverride>>(() => new Map())
  const [pageTokens, setPageTokens] = useState<ReadonlyMap<string, string>>(() => new Map())
  const [sharedConflict, setSharedConflict] = useState<{
    readonly message: string
    readonly onlyShared: () => void
    readonly setOnAll: () => void
  } | null>(null)
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
          valid.add(adNameMapKey(pageId, creativeKey(file)))
        }
        for (const asset of assets) {
          valid.add(adNameMapKey(pageId, asset.assetKey))
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
  }, [files, assets, targeting.pageIds])

  // Drop per-creative copy overrides for creatives no longer present, so a
  // removed file/asset can't leak its copy into a later submit.
  useEffect(() => {
    setCopyOverrides((prev) => {
      if (prev.size === 0) {
        return prev
      }
      const valid = new Set<string>()
      for (const file of files) {
        valid.add(creativeKey(file))
      }
      for (const asset of assets) {
        valid.add(asset.assetKey)
      }
      const next = new Map<string, CopyOverride>()
      for (const [key, value] of prev) {
        if (valid.has(key)) {
          next.set(key, value)
        }
      }
      return next.size === prev.size ? prev : next
    })
  }, [files, assets])

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
  const creativeKeys = useMemo(
    () => [...files.map((f) => creativeKey(f)), ...assets.map((a) => a.assetKey)],
    [files, assets],
  )
  // Validate the copy each ad would actually publish (its own override, else the
  // shared base) — not just the shared field. This blocks ads that would go out with
  // an empty primary text / headline, and stops falsely blocking when every creative
  // overrides an (empty) shared field.
  const emptyRequired = useMemo(
    () => countEmptyRequired(copy, copyOverrides, creativeKeys),
    [copy, copyOverrides, creativeKeys],
  )
  const canSubmit = canSubmitCreator(targeting, copy, creativeCount)
    && emptyRequired.primary === 0
    && emptyRequired.headline === 0
    && emptyRequired.url === 0

  // The library only consumes copy to flag which texts/URL are already added —
  // a non-urgent highlight. Deferring it keeps the heavy library tree off the
  // keystroke critical path so the copy fields stay responsive while typing.
  const deferredCopy = useDeferredValue(copy)

  // Library "Add" writes the shared copy. When some creatives carry their own
  // value for that field, ask first (hybrid): keep the divergence and only update
  // the rest, or force the value onto everyone by clearing those overrides.
  const requestSharedAdd = useCallback((
    field: OverridableField,
    label: string,
    setShared: () => void,
  ) => {
    const customized = overrideCount(copyOverrides, field)
    if (customized === 0) {
      setShared()
      return
    }
    setSharedConflict({
      message: `${customized} ${customized === 1 ? 'creative uses' : 'creatives use'} a custom ${label}.`
        + ' Update the rest only, or set this on all of them?',
      onlyShared: () => {
        setShared()
        setSharedConflict(null)
      },
      setOnAll: () => {
        setShared()
        setCopyOverrides((prev) => clearFieldOverrides(prev, field))
        setSharedConflict(null)
      },
    })
  }, [copyOverrides])

  const handleAddPrimaryText = useCallback((value: string) => {
    requestSharedAdd('primaryTexts', 'primary text', () => {
      setCopy((prev) => ({ ...prev, primaryTexts: applyLibraryText(prev.primaryTexts, value, MAX_COPY_VARIATIONS) }))
    })
  }, [requestSharedAdd])

  const handleAddHeadline = useCallback((value: string) => {
    requestSharedAdd('headlines', 'headline', () => {
      setCopy((prev) => ({ ...prev, headlines: applyLibraryText(prev.headlines, value, MAX_COPY_VARIATIONS) }))
    })
  }, [requestSharedAdd])

  const handleAddUrl = useCallback((value: string) => {
    requestSharedAdd('url', 'destination URL', () => {
      setCopy((prev) => ({ ...prev, url: value }))
    })
  }, [requestSharedAdd])

  const handleAddCreative = useCallback((asset: AssetCreative) => {
    setAssets((prev) => addAsset(prev, asset))
  }, [])

  const addedAssetKeys = useMemo(() => new Set(assets.map((a) => a.assetKey)), [assets])

  const handleSubmit = useCallback((resolvedNames: ReadonlyMap<string, string>) => {
    if (!canSubmit || !targetMarket) {
      return
    }
    const isSinglePage = targeting.pageIds.length === 1
    const isSingleAd = targeting.pageIds.length * (files.length + assets.length) === 1
    const batchId = crypto.randomUUID()
    for (const { pageId, file, key } of adKeyCombos(targeting.pageIds, files)) {
      const name = resolvedNames.get(key) || copy.name || file.name
      const adCopy = resolveCopy(copy, copyOverrides.get(creativeKey(file)))
      queue.enqueue(buildPublishPayload({ targeting, copy: adCopy, pageId, name, isSinglePage }), file, batchId)
    }
    for (const pageId of targeting.pageIds) {
      for (const asset of assets) {
        const name = resolvedNames.get(adNameMapKey(pageId, asset.assetKey))
          || (isSingleAd ? copy.name.trim() : '')
          || asset.name
        const adCopy = resolveCopy(copy, copyOverrides.get(asset.assetKey))
        queue.enqueueAsset(buildPublishPayload({ targeting, copy: adCopy, pageId, name, isSinglePage }), asset, batchId)
      }
    }
    setFiles([])
    setAssets([])
    setAdNames(new Map())
    setPageTokens(new Map())
  }, [assets, canSubmit, copy, copyOverrides, files, queue, targeting, targetMarket])

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
        market={selectedMarket}
        allowedAccountIds={allowedAccountIds}
        targeting={targeting}
        onTargetingChange={setTargeting}
        files={files}
        onFilesChange={setFiles}
        assets={assets}
        onAssetsChange={setAssets}
        addedAssetKeys={addedAssetKeys}
        onAddCreative={handleAddCreative}
        copy={copy}
        onCopyChange={setCopy}
        copyOverrides={copyOverrides}
        onCopyOverridesChange={setCopyOverrides}
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
        emptyRequired={emptyRequired}
        onSubmit={handleSubmit}
      />
      <LibraryPane
        brandId={brandId}
        market={selectedMarket}
        primaryTexts={deferredCopy.primaryTexts}
        headlines={deferredCopy.headlines}
        url={deferredCopy.url}
        addedAssetKeys={addedAssetKeys}
        onAddPrimaryText={handleAddPrimaryText}
        onAddHeadline={handleAddHeadline}
        onAddUrl={handleAddUrl}
        onAddCreative={handleAddCreative}
      />

      <DecisionDialog
        open={sharedConflict !== null}
        title="Some creatives use custom copy"
        message={sharedConflict?.message ?? ''}
        onClose={() => setSharedConflict(null)}
        actions={[
          { label: 'Cancel', onClick: () => setSharedConflict(null) },
          { label: 'Set on all', onClick: () => sharedConflict?.setOnAll() },
          { label: 'Update the rest only', onClick: () => sharedConflict?.onlyShared(), emphasis: true },
        ]}
      />
    </Box>
  )
}

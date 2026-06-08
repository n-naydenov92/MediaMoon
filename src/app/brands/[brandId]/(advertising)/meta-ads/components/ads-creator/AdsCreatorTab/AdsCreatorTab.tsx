'use client'

import { useCallback, useDeferredValue, useMemo } from 'react'
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
import { addAsset, type AssetCreative } from './assetCreative'
import { useAdDraft } from './useAdDraft'
import { useSharedCopyAdd } from './useSharedCopyAdd'
import { useLaunchSubmit } from './useLaunchSubmit'
import { useLaunchQueue } from './useLaunchQueue'
import styles from './AdsCreatorTab.module.css'

interface Props {
  readonly brandId: BrandId
}

export default function AdsCreatorTab({ brandId }: Props): JSX.Element {
  const brand = findBrandById(brandId)
  const { selectedMarket } = useBrandShellContext()
  const queue = useLaunchQueue()
  const {
    files,
    setFiles,
    assets,
    setAssets,
    targeting,
    setTargeting,
    copy,
    setCopy,
    adNames,
    setAdNames,
    copyOverrides,
    setCopyOverrides,
    pageTokens,
    setPageTokens,
    emptyRequired,
    addedAssetKeys,
    canSubmit,
    isDirty,
    resetDraft,
    clearForNextBatch,
  } = useAdDraft()

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

  // The library only consumes copy to flag which texts/URL are already added —
  // a non-urgent highlight. Deferring it keeps the heavy library tree off the
  // keystroke critical path so the copy fields stay responsive while typing.
  const deferredCopy = useDeferredValue(copy)

  const {
    sharedConflict,
    handleAddPrimaryText,
    handleAddHeadline,
    handleAddUrl,
    closeConflict,
  } = useSharedCopyAdd({ copyOverrides, setCopy, setCopyOverrides })

  const handleAddCreative = useCallback((asset: AssetCreative) => {
    setAssets((prev) => addAsset(prev, asset))
  }, [setAssets])

  const handleSubmit = useLaunchSubmit({
    canSubmit,
    targetMarket,
    targeting,
    files,
    assets,
    copy,
    copyOverrides,
    queue,
    clearForNextBatch,
  })

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
        canReset={isDirty}
        onResetDraft={resetDraft}
      />
      <LibraryPane
        brandId={brandId}
        market={selectedMarket}
        targetAccountId={targeting.accountId}
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
        onClose={closeConflict}
        actions={[
          { label: 'Cancel', onClick: closeConflict },
          { label: 'Set on all', onClick: () => sharedConflict?.setOnAll() },
          { label: 'Update the rest only', onClick: () => sharedConflict?.onlyShared(), emphasis: true },
        ]}
      />
    </Box>
  )
}

'use client'

import { useCallback, useDeferredValue, useEffect, useMemo } from 'react'
import Box from '@mui/material/Box'
import type { BrandId } from '@/types'
import { useBrandShellContext } from '@/contexts/brandShell/useBrandShellContext'
import { accountIdsForSelection } from '@/lib/tenancy/selection'
import Notice from '../../Notice/Notice'
import CreatorPane from './CreatorPane/CreatorPane'
import LibraryPane from './LibraryPane/LibraryPane'
import DecisionDialog from './DecisionDialog/DecisionDialog'
import { withAccount } from './CreatorPane/helpers'
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
  const { selectedMarket, metaAccounts } = useBrandShellContext()
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
    naming,
    namingActions,
    copyOverrides,
    setCopyOverrides,
    slots,
    duplicateCreative,
    removeDuplicate,
    removeCreative,
    emptyRequired,
    addedAssetKeys,
    canSubmit,
    isDirty,
    resetDraft,
    clearForNextBatch,
  } = useAdDraft()

  // "All markets" offers every account of the brand. The market of an ad is the market
  // of the account it publishes to, so nothing is assumed from the selector.
  const allowedAccountIds = useMemo(
    () => accountIdsForSelection(metaAccounts, selectedMarket),
    [metaAccounts, selectedMarket],
  )

  // Switching market can take the selected account out of the list. Drop it, so the
  // draft never publishes to an account the operator can no longer see.
  useEffect(() => {
    if (targeting.accountId !== '' && !allowedAccountIds.includes(targeting.accountId)) {
      setTargeting((prev) => withAccount(prev, ''))
    }
  }, [allowedAccountIds, targeting.accountId, setTargeting])

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
    targeting,
    slots,
    copy,
    copyOverrides,
    queue,
    clearForNextBatch,
  })

  if (allowedAccountIds.length === 0) {
    return (
      <Box component="section" className={styles.rootFallback}>
        <Notice variant="info" title="No ad accounts mapped">
          Connect at least one Meta ad account to this brand and market before launching ads.
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
        slots={slots}
        onDuplicateCreative={duplicateCreative}
        onRemoveDuplicate={removeDuplicate}
        onRemoveCreative={removeCreative}
        addedAssetKeys={addedAssetKeys}
        onAddCreative={handleAddCreative}
        copy={copy}
        onCopyChange={setCopy}
        copyOverrides={copyOverrides}
        onCopyOverridesChange={setCopyOverrides}
        naming={naming}
        namingActions={namingActions}
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
      <Box className={styles.paneDivider} aria-hidden />
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

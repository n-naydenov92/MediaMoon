'use client'

import { memo, useCallback, useDeferredValue, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import type { BrandId } from '@/config/brands'
import type { MarketSelection } from '@/lib/markets'
import type { StatusFilter } from '@/lib/gateways/MetaAdsGateway'
import type { AssetCreative } from '../assetCreative'
import { incompatibleAssetKeys } from '../assetCompat'
import type { CopyValue } from '../CopyForm/CopyForm'
import type { CopyOverride, EmptyRequiredCounts } from '../perCreativeCopy'
import { useBaseFilled } from '../useBaseFilled'
import type { AdSetRecord, LaunchJob } from '../useLaunchQueue'
import StepAccordion from '../StepAccordion/StepAccordion'
import AccountStep from '../AccountStep/AccountStep'
import CampaignStep from '../CampaignStep/CampaignStep'
import ProfilesStep from '../ProfilesStep/ProfilesStep'
import FilesStep from '../FilesStep/FilesStep'
import CopyStep from '../CopyStep/CopyStep'
import PreviewDialog from '../PreviewDialog/PreviewDialog'
import PublishBar from '../PublishBar/PublishBar'
import CreatorHeader from './CreatorHeader/CreatorHeader'
import AdNamesDialog from './AdNamesDialog/AdNamesDialog'
import CopyEachDialog from './CopyEachDialog/CopyEachDialog'
import {
  assetNameable,
  buildAdNameMap,
  buildAutoAdName,
  fileNameable,
  resolvePageToken,
  STEP_IDS,
  STEP_LABELS,
  type Completion,
} from './helpers'
import { useCreatorSteps } from './useCreatorSteps'
import { type TargetingValue, useTargetingData } from './useTargetingData'
import styles from './CreatorPane.module.css'

interface Props {
  readonly brandId: BrandId
  readonly market: MarketSelection
  readonly allowedAccountIds: readonly string[]
  readonly targeting: TargetingValue
  readonly onTargetingChange: (next: TargetingValue) => void
  readonly files: readonly File[]
  readonly onFilesChange: (next: readonly File[]) => void
  readonly assets: readonly AssetCreative[]
  readonly onAssetsChange: (next: readonly AssetCreative[]) => void
  readonly addedAssetKeys: ReadonlySet<string>
  readonly onAddCreative: (asset: AssetCreative) => void
  readonly copy: CopyValue
  readonly onCopyChange: (next: CopyValue) => void
  readonly copyOverrides: ReadonlyMap<string, CopyOverride>
  readonly onCopyOverridesChange: (next: ReadonlyMap<string, CopyOverride>) => void
  readonly adNames: ReadonlyMap<string, string>
  readonly onAdNamesChange: (next: ReadonlyMap<string, string>) => void
  readonly pageTokens: ReadonlyMap<string, string>
  readonly onPageTokensChange: (next: ReadonlyMap<string, string>) => void
  readonly jobs: readonly LaunchJob[]
  readonly onRetry: (jobId: string) => void
  readonly onStop: (jobId: string) => void
  readonly onDismiss: (jobId: string) => void
  readonly onAdSetCreated: (record: AdSetRecord) => void
  readonly canSubmit: boolean
  readonly emptyRequired: EmptyRequiredCounts
  readonly onSubmit: (adNames: ReadonlyMap<string, string>, adSetName: string) => void
  readonly canReset: boolean
  readonly onResetDraft: () => void
}

export default memo(function CreatorPane({
  brandId,
  market,
  allowedAccountIds,
  targeting,
  onTargetingChange,
  files,
  onFilesChange,
  assets,
  onAssetsChange,
  addedAssetKeys,
  onAddCreative,
  copy,
  onCopyChange,
  copyOverrides,
  onCopyOverridesChange,
  adNames,
  onAdNamesChange,
  pageTokens,
  onPageTokensChange,
  jobs,
  onRetry,
  onStop,
  onDismiss,
  onAdSetCreated,
  canSubmit,
  emptyRequired,
  onSubmit,
  canReset,
  onResetDraft,
}: Props): JSX.Element {
  const [campaignStatus, setCampaignStatus] = useState<StatusFilter>('all')
  const [adSetStatus, setAdSetStatus] = useState<StatusFilter>('all')

  const data = useTargetingData({
    brandId,
    allowedAccountIds,
    accountId: targeting.accountId,
    campaignId: targeting.campaignId,
    pageIds: targeting.pageIds,
    campaignStatus,
    adSetStatus,
  })

  const isSinglePage = targeting.pageIds.length === 1
  const creativeCount = files.length + assets.length
  const baseFilled = useBaseFilled(copy)
  // Library assets that can't publish to the selected account (cross-BM videos).
  // They block the Files step and Publish until removed, and show an inline error.
  const invalidAssetKeys = useMemo(
    () => incompatibleAssetKeys(assets, targeting.accountId),
    [assets, targeting.accountId],
  )

  // The per-creative editor (CopyEachDialog) writes overrides on every keystroke.
  // The Files and Copy steps behind the dialog only need overrides for their badge
  // counts — non-urgent — so they read a deferred copy. The dialog itself keeps the
  // live map so the edited field stays instant. Without this, each keystroke in the
  // dialog synchronously re-renders the whole creative list behind it (the lag).
  const deferredOverrides = useDeferredValue(copyOverrides)
  const selectedAccount = useMemo(
    () => data.accounts.find((a) => a.id === targeting.accountId) ?? null,
    [data.accounts, targeting.accountId],
  )
  const accountCurrency = selectedAccount?.currency ?? 'USD'
  const completion = useMemo<Completion>(() => ({
    account: targeting.accountId !== '',
    campaign: targeting.campaignId !== '' && targeting.adSetId !== '',
    profiles: targeting.pageIds.length > 0
      && (!isSinglePage || data.instagramAccounts.length === 0 || targeting.instagramId !== ''),
    files: creativeCount > 0 && invalidAssetKeys.size === 0,
    copy: (targeting.pageIds.length * creativeCount >= 2 || copy.name !== '')
      && emptyRequired.primary === 0
      && emptyRequired.headline === 0
      && emptyRequired.url === 0,
  }), [
    targeting.accountId,
    targeting.campaignId,
    targeting.adSetId,
    targeting.pageIds,
    targeting.instagramId,
    isSinglePage,
    data.instagramAccounts.length,
    creativeCount,
    invalidAssetKeys,
    copy.name,
    emptyRequired.primary,
    emptyRequired.headline,
    emptyRequired.url,
  ])

  const { expanded, toggleHandlers } = useCreatorSteps(completion)

  // Steps still blocking Publish — surfaced (on tap) in the PublishBar so the user
  // can jump straight to what's unfinished instead of hunting through the form.
  const incompleteSteps = useMemo(
    () => STEP_IDS
      .filter((id) => !completion[id])
      .map((id) => ({ label: STEP_LABELS[id], onOpen: toggleHandlers[id] })),
    [completion, toggleHandlers],
  )

  const [previewOpen, setPreviewOpen] = useState(false)
  const [adNamesOpen, setAdNamesOpen] = useState(false)
  const [copyEachOpen, setCopyEachOpen] = useState(false)
  const selectedPages = useMemo(
    () => data.pages.filter((p) => targeting.pageIds.includes(p.id)),
    [data.pages, targeting.pageIds],
  )

  const openPreview = useCallback(() => setPreviewOpen(true), [])
  const closePreview = useCallback(() => setPreviewOpen(false), [])
  const openAdNames = useCallback(() => setAdNamesOpen(true), [])
  const closeAdNames = useCallback(() => setAdNamesOpen(false), [])
  const openCopyEach = useCallback(() => setCopyEachOpen(true), [])
  const closeCopyEach = useCallback(() => setCopyEachOpen(false), [])
  const adsCount = (targeting.pageIds.length || 1) * creativeCount
  const isSingleAd = adsCount === 1

  // Every nameable ad creative — uploaded files and library assets alike — so the
  // naming UI and submit cover both, not just the manual uploads.
  const nameableCreatives = useMemo(
    () => [...files.map(fileNameable), ...assets.map(assetNameable)],
    [files, assets],
  )

  // Single ad: fill the shared Ad name field with the structured template
  // (page token baked in, since there is exactly one page).
  const handleAutoNameSingle = useCallback(() => {
    const [creative] = nameableCreatives
    const [page] = selectedPages
    if (!creative) {
      return
    }
    const tok = page ? resolvePageToken(pageTokens, page.id, page.name) : ''
    onCopyChange({ ...copy, name: buildAutoAdName(creative, tok) })
  }, [copy, nameableCreatives, onCopyChange, pageTokens, selectedPages])

  const handleSubmit = useCallback(() => {
    const adSetName = data.adSets.find((a) => a.id === targeting.adSetId)?.name ?? ''
    onSubmit(buildAdNameMap({
      pages: selectedPages, creatives: nameableCreatives, pageTokens, copy, adNames, isSingleAd,
    }), adSetName)
  }, [
    adNames, copy, nameableCreatives, isSingleAd, onSubmit, pageTokens, selectedPages,
    data.adSets, targeting.adSetId,
  ])

  // Each step's body is memoized so its element keeps a stable identity. StepAccordion
  // is memo'd, but `children` is a prop — a fresh element every render would re-render
  // all five MUI accordions on each copy keystroke. With stable children, only the step
  // whose inputs actually changed re-renders.
  const accountStepEl = useMemo(() => (
    <AccountStep accounts={data.accounts} value={targeting} onChange={onTargetingChange} />
  ), [data.accounts, targeting, onTargetingChange])

  const campaignStepEl = useMemo(() => (
    <CampaignStep
      campaigns={data.campaigns}
      adSets={data.adSets}
      value={targeting}
      onChange={onTargetingChange}
      campaignStatus={campaignStatus}
      onCampaignStatusChange={setCampaignStatus}
      adSetStatus={adSetStatus}
      onAdSetStatusChange={setAdSetStatus}
      refetchAdSets={data.refetchAdSets}
      accountCurrency={accountCurrency}
      dsaEntities={data.dsaEntities}
      onAdSetCreated={onAdSetCreated}
      brandId={brandId}
    />
  ), [
    data.campaigns, data.adSets, targeting, onTargetingChange, campaignStatus, setCampaignStatus,
    adSetStatus, setAdSetStatus, data.refetchAdSets, accountCurrency, data.dsaEntities,
    onAdSetCreated, brandId,
  ])

  const profilesStepEl = useMemo(() => (
    <ProfilesStep
      pages={data.pages}
      instagramAccounts={data.instagramAccounts}
      value={targeting}
      onChange={onTargetingChange}
    />
  ), [data.pages, data.instagramAccounts, targeting, onTargetingChange])

  const filesStepEl = useMemo(() => (
    <FilesStep
      files={files}
      onChange={onFilesChange}
      assets={assets}
      onAssetsChange={onAssetsChange}
      baseFilled={baseFilled}
      copyOverrides={deferredOverrides}
      incompatibleAssetKeys={invalidAssetKeys}
    />
  ), [files, onFilesChange, assets, onAssetsChange, baseFilled, deferredOverrides, invalidAssetKeys])

  const copyStepEl = useMemo(() => (
    <CopyStep
      value={copy}
      onChange={onCopyChange}
      adsCount={adsCount}
      totalCreatives={creativeCount}
      overrides={deferredOverrides}
      onAutoName={isSingleAd ? handleAutoNameSingle : undefined}
      onNameEach={adsCount >= 2 ? openAdNames : undefined}
      onEditEach={creativeCount >= 2 ? openCopyEach : undefined}
    />
  ), [
    copy, onCopyChange, adsCount, deferredOverrides, isSingleAd, handleAutoNameSingle,
    openAdNames, openCopyEach, creativeCount,
  ])

  return (
    <Box className={styles.root}>
      <CreatorHeader
        canReset={canReset}
        onResetDraft={onResetDraft}
        onPreview={openPreview}
        jobs={jobs}
        accountId={targeting.accountId}
        onRetry={onRetry}
        onStop={onStop}
        onDismiss={onDismiss}
      />

      <Box className={styles.steps} tabIndex={0} aria-label="Ad creation steps">
        <StepAccordion
          index={1}
          title={STEP_LABELS.account}
          complete={completion.account}
          expanded={expanded.has('account')}
          onToggle={toggleHandlers.account}
        >
          {accountStepEl}
        </StepAccordion>

        <StepAccordion
          index={2}
          title={STEP_LABELS.campaign}
          complete={completion.campaign}
          expanded={expanded.has('campaign')}
          onToggle={toggleHandlers.campaign}
        >
          {campaignStepEl}
        </StepAccordion>

        <StepAccordion
          index={3}
          title={STEP_LABELS.profiles}
          complete={completion.profiles}
          expanded={expanded.has('profiles')}
          onToggle={toggleHandlers.profiles}
        >
          {profilesStepEl}
        </StepAccordion>

        <StepAccordion
          index={4}
          title={STEP_LABELS.files}
          complete={completion.files}
          error={invalidAssetKeys.size > 0}
          expanded={expanded.has('files')}
          onToggle={toggleHandlers.files}
        >
          {filesStepEl}
        </StepAccordion>

        <StepAccordion
          index={5}
          title={STEP_LABELS.copy}
          complete={completion.copy}
          expanded={expanded.has('copy')}
          onToggle={toggleHandlers.copy}
        >
          {copyStepEl}
        </StepAccordion>
      </Box>

      <Box className={styles.footer}>
        <PublishBar
          adsCount={targeting.pageIds.length * creativeCount}
          canSubmit={canSubmit}
          onSubmit={handleSubmit}
          jobs={jobs}
          incompleteSteps={incompleteSteps}
        />
      </Box>

      <PreviewDialog
        open={previewOpen}
        onClose={closePreview}
        copy={copy}
        files={files}
        pages={selectedPages}
      />

      <AdNamesDialog
        open={adNamesOpen}
        onClose={closeAdNames}
        creatives={nameableCreatives}
        selectedPages={selectedPages}
        names={adNames}
        onChange={onAdNamesChange}
        pageTokens={pageTokens}
        onPageTokensChange={onPageTokensChange}
      />

      <CopyEachDialog
        open={copyEachOpen}
        onClose={closeCopyEach}
        brandId={brandId}
        market={market}
        targetAccountId={targeting.accountId}
        files={files}
        assets={assets}
        baseCopy={copy}
        overrides={copyOverrides}
        onOverridesChange={onCopyOverridesChange}
        selectedPages={selectedPages}
        addedAssetKeys={addedAssetKeys}
        onAddCreative={onAddCreative}
      />
    </Box>
  )
})

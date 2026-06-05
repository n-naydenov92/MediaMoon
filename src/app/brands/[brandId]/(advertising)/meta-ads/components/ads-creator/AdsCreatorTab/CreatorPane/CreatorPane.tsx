'use client'

import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import type { BrandId } from '@/config/brands'
import type { MarketSelection } from '@/lib/markets'
import type { StatusFilter } from '@/lib/gateways/MetaAdsGateway'
import type { AssetCreative } from '../assetCreative'
import type { CopyValue } from '../CopyForm/CopyForm'
import type { CopyOverride } from '../perCreativeCopy'
import { useBaseFilled } from '../useBaseFilled'
import { isValidDestinationUrl } from '../CopyForm/helpers'
import type { AdSetRecord, LaunchJob } from '../useLaunchQueue'
import StepAccordion from '../StepAccordion/StepAccordion'
import AccountStep from '../AccountStep/AccountStep'
import CampaignStep from '../CampaignStep/CampaignStep'
import ProfilesStep from '../ProfilesStep/ProfilesStep'
import FilesStep from '../FilesStep/FilesStep'
import CopyStep from '../CopyStep/CopyStep'
import PreviewDialog from '../PreviewDialog/PreviewDialog'
import PublishBar from '../PublishBar/PublishBar'
import QueueLauncher from '../QueueLauncher/QueueLauncher'
import AdNamesDialog from './AdNamesDialog/AdNamesDialog'
import CopyEachDialog from './CopyEachDialog/CopyEachDialog'
import {
  assetNameable,
  buildAdNameMap,
  buildAutoAdName,
  fileNameable,
  resolvePageToken,
} from './helpers'
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
  readonly onSubmit: (adNames: ReadonlyMap<string, string>) => void
}

const STEP_IDS = ['account', 'campaign', 'profiles', 'files', 'copy'] as const
type StepId = typeof STEP_IDS[number]
type Completion = Readonly<Record<StepId, boolean>>

function firstIncomplete(c: Completion): StepId | null {
  return STEP_IDS.find((id) => !c[id]) ?? null
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
  onSubmit,
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
    files: creativeCount > 0,
    copy: (targeting.pageIds.length * creativeCount >= 2 || copy.name !== '')
      && copy.headlines[0] !== ''
      && copy.primaryTexts[0] !== ''
      && isValidDestinationUrl(copy.url),
  }), [
    targeting.accountId,
    targeting.campaignId,
    targeting.adSetId,
    targeting.pageIds,
    targeting.instagramId,
    isSinglePage,
    data.instagramAccounts.length,
    creativeCount,
    copy.name,
    copy.headlines,
    copy.primaryTexts,
    copy.url,
  ])

  const [expanded, setExpanded] = useState<ReadonlySet<StepId>>(() => {
    const fi = firstIncomplete(completion)
    return fi ? new Set<StepId>([fi]) : new Set<StepId>()
  })

  const prevCompletionRef = useRef<Completion>(completion)
  useEffect(() => {
    const prev = prevCompletionRef.current
    prevCompletionRef.current = completion
    setExpanded((curr) => {
      let next = curr
      for (const id of STEP_IDS) {
        if (id === 'profiles' || id === 'files' || id === 'copy') continue
        if (!prev[id] && completion[id] && curr.has(id)) {
          const cleaned = new Set(curr)
          cleaned.delete(id)
          const fi = firstIncomplete(completion)
          if (fi && !cleaned.has(fi)) {
            cleaned.add(fi)
          }
          next = cleaned
        }
      }
      return next
    })
  }, [completion])

  const toggle = useCallback((id: StepId) => {
    setExpanded((curr) => {
      const next = new Set(curr)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  // One stable handler per step so the memoized StepAccordions don't re-render on
  // every keystroke (an inline `() => toggle(id)` would break their memo each time).
  const toggleHandlers = useMemo(() => {
    const map = {} as Record<StepId, () => void>
    for (const id of STEP_IDS) {
      map[id] = () => toggle(id)
    }
    return map
  }, [toggle])

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
    onSubmit(buildAdNameMap({
      pages: selectedPages, creatives: nameableCreatives, pageTokens, copy, adNames, isSingleAd,
    }))
  }, [adNames, copy, nameableCreatives, isSingleAd, onSubmit, pageTokens, selectedPages])

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
    />
  ), [files, onFilesChange, assets, onAssetsChange, baseFilled, deferredOverrides])

  const copyStepEl = useMemo(() => (
    <CopyStep
      value={copy}
      onChange={onCopyChange}
      adsCount={adsCount}
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
      <Box component="header" className={styles.header}>
        <Box className={styles.headerTitleWrap}>
          <Typography component="span" variant="inherit" className={styles.headerKicker}>Draft</Typography>
          <Typography component="h2" variant="inherit" className={styles.headerTitle}>Launch new ads</Typography>
        </Box>
        <Box className={styles.headerActions}>
          <Box
            component="button"
            type="button"
            className={styles.previewButton}
            onClick={openPreview}
          >
            <VisibilityOutlinedIcon fontSize="small" />
            Preview
          </Box>
          <QueueLauncher
            jobs={jobs}
            accountId={targeting.accountId}
            onRetry={onRetry}
            onStop={onStop}
            onDismiss={onDismiss}
          />
        </Box>
      </Box>

      <Box className={styles.steps} tabIndex={0} aria-label="Ad creation steps">
        <StepAccordion
          index={1}
          title="Account"
          complete={completion.account}
          expanded={expanded.has('account')}
          onToggle={toggleHandlers.account}
        >
          {accountStepEl}
        </StepAccordion>

        <StepAccordion
          index={2}
          title="Campaign"
          complete={completion.campaign}
          expanded={expanded.has('campaign')}
          onToggle={toggleHandlers.campaign}
        >
          {campaignStepEl}
        </StepAccordion>

        <StepAccordion
          index={3}
          title="Profiles"
          complete={completion.profiles}
          expanded={expanded.has('profiles')}
          onToggle={toggleHandlers.profiles}
        >
          {profilesStepEl}
        </StepAccordion>

        <StepAccordion
          index={4}
          title="Files"
          complete={completion.files}
          expanded={expanded.has('files')}
          onToggle={toggleHandlers.files}
        >
          {filesStepEl}
        </StepAccordion>

        <StepAccordion
          index={5}
          title="Copy"
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

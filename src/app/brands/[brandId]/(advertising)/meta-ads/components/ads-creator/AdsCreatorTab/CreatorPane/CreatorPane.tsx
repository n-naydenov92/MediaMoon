'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import type { BrandId } from '@/config/brands'
import type { StatusFilter } from '@/lib/gateways/MetaAdsGateway'
import type { CopyValue } from '../CopyForm/CopyForm'
import type { LaunchJob } from '../useLaunchQueue'
import StepAccordion from '../StepAccordion/StepAccordion'
import AccountStep from '../AccountStep/AccountStep'
import CampaignStep from '../CampaignStep/CampaignStep'
import ProfilesStep from '../ProfilesStep/ProfilesStep'
import FilesStep from '../FilesStep/FilesStep'
import CopyStep from '../CopyStep/CopyStep'
import PreviewDialog from '../PreviewDialog/PreviewDialog'
import PublishBar from '../PublishBar/PublishBar'
import QueueLauncher from '../QueueLauncher/QueueLauncher'
import { type TargetingValue, useTargetingData } from './useTargetingData'
import styles from './CreatorPane.module.css'

interface Props {
  readonly brandId: BrandId
  readonly allowedAccountIds: readonly string[]
  readonly targeting: TargetingValue
  readonly onTargetingChange: (next: TargetingValue) => void
  readonly files: readonly File[]
  readonly onFilesChange: (next: readonly File[]) => void
  readonly copy: CopyValue
  readonly onCopyChange: (next: CopyValue) => void
  readonly jobs: readonly LaunchJob[]
  readonly onRetry: (jobId: string) => void
  readonly onDismiss: (jobId: string) => void
  readonly canSubmit: boolean
  readonly onSubmit: () => void
}

const STEP_IDS = ['account', 'campaign', 'profiles', 'files', 'copy'] as const
type StepId = typeof STEP_IDS[number]
type Completion = Readonly<Record<StepId, boolean>>

function firstIncomplete(c: Completion): StepId | null {
  return STEP_IDS.find((id) => !c[id]) ?? null
}

export default memo(function CreatorPane({
  brandId,
  allowedAccountIds,
  targeting,
  onTargetingChange,
  files,
  onFilesChange,
  copy,
  onCopyChange,
  jobs,
  onRetry,
  onDismiss,
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
  const completion = useMemo<Completion>(() => ({
    account: targeting.accountId !== '',
    campaign: targeting.campaignId !== '' && targeting.adSetId !== '',
    profiles: targeting.pageIds.length > 0
      && (!isSinglePage || data.instagramAccounts.length === 0 || targeting.instagramId !== ''),
    files: files.length > 0,
    copy: copy.name !== ''
      && copy.headlines[0] !== ''
      && copy.primaryTexts[0] !== ''
      && copy.url !== '',
  }), [
    targeting.accountId,
    targeting.campaignId,
    targeting.adSetId,
    targeting.pageIds,
    targeting.instagramId,
    isSinglePage,
    data.instagramAccounts.length,
    files.length,
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

  const [previewOpen, setPreviewOpen] = useState(false)
  const previewPageId = targeting.pageIds[0] ?? ''
  const selectedPage = useMemo(
    () => data.pages.find((p) => p.id === previewPageId) ?? null,
    [data.pages, previewPageId],
  )

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
            onClick={() => setPreviewOpen(true)}
          >
            <VisibilityOutlinedIcon fontSize="small" />
            Preview
          </Box>
          <QueueLauncher
            jobs={jobs}
            accountId={targeting.accountId}
            onRetry={onRetry}
            onDismiss={onDismiss}
          />
        </Box>
      </Box>

      <Box className={styles.steps}>
        <StepAccordion
          index={1}
          title="Account"
          complete={completion.account}
          expanded={expanded.has('account')}
          onToggle={() => toggle('account')}
        >
          <AccountStep accounts={data.accounts} value={targeting} onChange={onTargetingChange} />
        </StepAccordion>

        <StepAccordion
          index={2}
          title="Campaign"
          complete={completion.campaign}
          expanded={expanded.has('campaign')}
          onToggle={() => toggle('campaign')}
        >
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
          />
        </StepAccordion>

        <StepAccordion
          index={3}
          title="Profiles"
          complete={completion.profiles}
          expanded={expanded.has('profiles')}
          onToggle={() => toggle('profiles')}
        >
          <ProfilesStep
            pages={data.pages}
            instagramAccounts={data.instagramAccounts}
            value={targeting}
            onChange={onTargetingChange}
          />
        </StepAccordion>

        <StepAccordion
          index={4}
          title="Files"
          complete={completion.files}
          expanded={expanded.has('files')}
          onToggle={() => toggle('files')}
        >
          <FilesStep files={files} onChange={onFilesChange} />
        </StepAccordion>

        <StepAccordion
          index={5}
          title="Copy"
          complete={completion.copy}
          expanded={expanded.has('copy')}
          onToggle={() => toggle('copy')}
        >
          <CopyStep value={copy} onChange={onCopyChange} />
        </StepAccordion>
      </Box>

      <Box className={styles.footer}>
        <PublishBar
          adsCount={targeting.pageIds.length * files.length}
          canSubmit={canSubmit}
          onSubmit={onSubmit}
          jobs={jobs}
        />
      </Box>

      <PreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        copy={copy}
        files={files}
        page={selectedPage}
      />
    </Box>
  )
})

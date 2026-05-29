'use client'

import { memo, useCallback, useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import CloseIcon from '@mui/icons-material/Close'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import type {
  AdSetDetail,
  AttributionWindow,
  BudgetType,
  Gender,
  Pixel,
} from '@/lib/gateways/MetaAdsGateway'
import SectionTitle from './SectionTitle/SectionTitle'
import SourceRows from './SourceRows/SourceRows'
import StatusToggle from './StatusToggle/StatusToggle'
import NameSection from './NameSection/NameSection'
import BudgetScheduleSection from './BudgetScheduleSection/BudgetScheduleSection'
import AudienceSection from './AudienceSection/AudienceSection'
import DynamicCreativeSection from './DynamicCreativeSection/DynamicCreativeSection'
import EuAdvertiserSection from './EuAdvertiserSection/EuAdvertiserSection'
import ConversionSection from './ConversionSection/ConversionSection'
import PlacementsSection from './PlacementsSection/PlacementsSection'
import { buildDuplicateName, buildDuplicatePayload } from './helpers'
import { useAdSetDraft } from './useAdSetDraft'
import styles from './AdSetEditor.module.css'

interface Props {
  readonly open: boolean
  readonly onClose: () => void
  readonly onSuccess?: (newAdSetId: string, newAdSetName: string, status: 'PAUSED' | 'ACTIVE') => void
  readonly accountId: string
  readonly sourceAdSetId: string
  readonly sourceAdSetName: string
  readonly sourceCampaignName: string
}

interface DuplicateResponse {
  readonly result?: { readonly adSetId: string }
  readonly error?: string
}

interface FetchAdSetResponse {
  readonly result?: AdSetDetail
  readonly error?: string
}

interface FetchPixelsResponse {
  readonly result?: readonly Pixel[]
  readonly error?: string
}

export default memo(function AdSetEditor({
  open,
  onClose,
  onSuccess,
  accountId,
  sourceAdSetId,
  sourceAdSetName,
  sourceCampaignName,
}: Props): JSX.Element {
  const fullScreen = useMediaQuery('(max-width: 600px)')
  const [draft, dispatch] = useAdSetDraft(sourceAdSetName)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [source, setSource] = useState<AdSetDetail | null>(null)
  const [currency, setCurrency] = useState<string>('USD')
  const [pixels, setPixels] = useState<readonly Pixel[]>([])
  const [pixelsLoading, setPixelsLoading] = useState<boolean>(false)

  // Reset on every open — closing the dialog discards the draft.
  useEffect(() => {
    if (!open) return
    dispatch({ type: 'reset', initialName: buildDuplicateName(sourceAdSetName) })
    setError(null)
    setSubmitting(false)
    setSource(null)
    setCurrency('USD')
    setPixels([])
  }, [open, sourceAdSetName, dispatch])

  // Pixels — fire-and-forget; empty list is acceptable.
  useEffect(() => {
    if (!open || !accountId) return undefined
    const ctrl = new AbortController()
    setPixelsLoading(true)
    void (async () => {
      try {
        const response = await fetch(
          `/api/meta-ads/pixels?accountId=${encodeURIComponent(accountId)}`,
          { signal: ctrl.signal },
        )
        const json = (await response.json().catch(() => ({}))) as FetchPixelsResponse
        if (ctrl.signal.aborted) return
        setPixels(response.ok && json.result ? json.result : [])
      } catch {
        // pixels are optional — silently empty
      } finally {
        if (!ctrl.signal.aborted) setPixelsLoading(false)
      }
    })()
    return () => ctrl.abort()
  }, [open, accountId])

  // Ad set detail + hydrate.
  useEffect(() => {
    if (!open || !sourceAdSetId || !accountId) return undefined
    const ctrl = new AbortController()
    setLoading(true)
    void (async () => {
      try {
        const response = await fetch(
          `/api/meta-ads/adsets/${encodeURIComponent(sourceAdSetId)}?accountId=${encodeURIComponent(accountId)}`,
          { signal: ctrl.signal },
        )
        const json = (await response.json().catch(() => ({}))) as FetchAdSetResponse
        if (ctrl.signal.aborted) return
        if (!response.ok || !json.result) {
          throw new Error(json.error ?? `HTTP ${response.status}`)
        }
        const detail = json.result
        // Older ad sets return UNDEFINED for destination_type when conversions
        // are pixel-driven; coerce to WEBSITE so the UI shows the right fields.
        const rawDest = detail.destinationType
        const looksLikeWebsite = (!rawDest || rawDest === 'UNDEFINED')
          && (detail.pixelId !== '' || detail.customEventType !== '')
        const normalized: AdSetDetail = {
          ...detail,
          destinationType: looksLikeWebsite ? 'WEBSITE' : rawDest,
          bidStrategy: detail.bidStrategy || 'LOWEST_COST_WITHOUT_CAP',
        }
        setSource(normalized)
        setCurrency(detail.currency)
        dispatch({ type: 'hydrate', source: normalized })
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Failed to load ad set')
      } finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    })()
    return () => ctrl.abort()
  }, [open, sourceAdSetId, accountId, dispatch])

  const handleDuplicate = useCallback(async (): Promise<void> => {
    const trimmed = draft.name.trim()
    if (!trimmed || !sourceAdSetId || !accountId) return
    setSubmitting(true)
    setError(null)

    const payload = buildDuplicatePayload(draft, source, sourceAdSetId)

    try {
      const response = await fetch(
        `/api/meta-ads/adsets/duplicate?accountId=${encodeURIComponent(accountId)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )
      const json = (await response.json().catch(() => ({}))) as DuplicateResponse
      if (!response.ok || !json.result) {
        throw new Error(json.error ?? `HTTP ${response.status}`)
      }
      onSuccess?.(json.result.adSetId, trimmed, draft.activate ? 'ACTIVE' : 'PAUSED')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setSubmitting(false)
    }
  }, [draft, source, sourceAdSetId, accountId, onSuccess, onClose])

  const handleNameChange = useCallback((value: string) => dispatch({ type: 'setName', value }), [dispatch])
  const handleActivateChange = useCallback((value: boolean) => dispatch({ type: 'setActivate', value }), [dispatch])
  const handleBudgetTypeChange = useCallback((value: BudgetType) => dispatch({ type: 'setBudgetType', value }), [dispatch])
  const handleBudgetMajorUnitsChange = useCallback((value: number) => dispatch({ type: 'setBudgetMajorUnits', value }), [dispatch])
  const handleStartTimeChange = useCallback((value: string) => dispatch({ type: 'setStartTime', value }), [dispatch])
  const handleEndTimeChange = useCallback((value: string) => dispatch({ type: 'setEndTime', value }), [dispatch])
  const handleAgeChange = useCallback(
    (ageMin: number, ageMax: number) => dispatch({ type: 'setAgeRange', ageMin, ageMax }),
    [dispatch],
  )
  const handleGenderChange = useCallback((value: Gender) => dispatch({ type: 'setGender', value }), [dispatch])
  const handleCountriesChange = useCallback((value: readonly string[]) => dispatch({ type: 'setCountries', value }), [dispatch])
  const handleAdvantageAudienceChange = useCallback((value: boolean) => dispatch({ type: 'setAdvantageAudience', value }), [dispatch])
  const handleAdvantageAgeChange = useCallback((value: boolean) => dispatch({ type: 'setAdvantageAge', value }), [dispatch])
  const handleAdvantageGenderChange = useCallback((value: boolean) => dispatch({ type: 'setAdvantageGender', value }), [dispatch])
  const handleIsDynamicCreativeChange = useCallback((value: boolean) => dispatch({ type: 'setIsDynamicCreative', value }), [dispatch])
  const handleDsaBeneficiaryChange = useCallback((value: string) => dispatch({ type: 'setDsaBeneficiary', value }), [dispatch])
  const handleDsaPayorChange = useCallback((value: string) => dispatch({ type: 'setDsaPayor', value }), [dispatch])
  const handleOptimizationGoalChange = useCallback((value: string) => dispatch({ type: 'setOptimizationGoal', value }), [dispatch])
  const handleBidStrategyChange = useCallback((value: string) => dispatch({ type: 'setBidStrategy', value }), [dispatch])
  const handleBidAmountChange = useCallback((value: number) => dispatch({ type: 'setBidAmountMajorUnits', value }), [dispatch])
  const handleDestinationTypeChange = useCallback((value: string) => dispatch({ type: 'setDestinationType', value }), [dispatch])
  const handlePixelIdChange = useCallback((value: string) => dispatch({ type: 'setPixelId', value }), [dispatch])
  const handleCustomEventTypeChange = useCallback((value: string) => dispatch({ type: 'setCustomEventType', value }), [dispatch])
  const handleAttributionSpecChange = useCallback(
    (value: readonly AttributionWindow[]) => dispatch({ type: 'setAttributionSpec', value }),
    [dispatch],
  )

  const onDuplicateClick = useCallback(() => {
    void handleDuplicate()
  }, [handleDuplicate])

  const sectionsDisabled = submitting || loading

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      aria-labelledby="ad-set-editor-title"
      classes={{ paper: styles.paper }}
    >
      {(submitting || loading) && <LinearProgress className={styles.progress} />}

      <Box component="header" className={styles.header}>
        <Box className={styles.headerTitleWrap}>
          <ContentCopyIcon className={styles.headerIcon} fontSize="inherit" />
          <Typography
            id="ad-set-editor-title"
            component="h2"
            variant="inherit"
            className={styles.headerTitle}
          >
            Duplicate ad set
          </Typography>
        </Box>
        <IconButton
          aria-label="Close"
          onClick={onClose}
          disabled={submitting}
          className={styles.closeButton}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Box className={styles.body}>
        <SourceRows
          sourceCampaignName={sourceCampaignName}
          sourceAdSetName={sourceAdSetName}
        />

        <Box className={styles.sectionCard}>
          <SectionTitle icon={<InfoOutlinedIcon fontSize="inherit" />}>
            General
          </SectionTitle>
          <StatusToggle
            activate={draft.activate}
            onActivateChange={handleActivateChange}
            disabled={submitting}
          />
          <NameSection
            name={draft.name}
            onNameChange={handleNameChange}
            disabled={submitting}
          />
        </Box>

        <Box className={styles.sectionCard}>
          <ConversionSection
            destinationType={draft.destinationType}
            optimizationGoal={draft.optimizationGoal}
            pixelId={draft.pixelId}
            customEventType={draft.customEventType}
            bidStrategy={draft.bidStrategy}
            bidAmountMajorUnits={draft.bidAmountMajorUnits}
            currency={currency}
            pixels={pixels}
            pixelsLoading={pixelsLoading}
            attributionSpec={draft.attributionSpec}
            onDestinationTypeChange={handleDestinationTypeChange}
            onOptimizationGoalChange={handleOptimizationGoalChange}
            onPixelIdChange={handlePixelIdChange}
            onCustomEventTypeChange={handleCustomEventTypeChange}
            onBidStrategyChange={handleBidStrategyChange}
            onBidAmountChange={handleBidAmountChange}
            onAttributionSpecChange={handleAttributionSpecChange}
            disabled={sectionsDisabled}
          />
        </Box>

        <Box className={styles.sectionCard}>
          <DynamicCreativeSection
            enabled={draft.isDynamicCreative}
            onChange={handleIsDynamicCreativeChange}
            disabled={sectionsDisabled}
          />
        </Box>

        <Box className={styles.sectionCard}>
          <BudgetScheduleSection
            budgetType={draft.budgetType}
            budgetMajorUnits={draft.budgetMajorUnits}
            startTime={draft.startTime}
            endTime={draft.endTime}
            currency={currency}
            isCbo={source?.campaignBudget !== null && source?.budgetMinorUnits === 0}
            onBudgetTypeChange={handleBudgetTypeChange}
            onBudgetMajorUnitsChange={handleBudgetMajorUnitsChange}
            onStartTimeChange={handleStartTimeChange}
            onEndTimeChange={handleEndTimeChange}
            disabled={sectionsDisabled}
          />
        </Box>

        <Box className={styles.sectionCard}>
          <AudienceSection
            ageMin={draft.ageMin}
            ageMax={draft.ageMax}
            gender={draft.gender}
            countries={draft.countries}
            advantageAudience={draft.advantageAudience}
            advantageAge={draft.advantageAge}
            advantageGender={draft.advantageGender}
            onAgeChange={handleAgeChange}
            onGenderChange={handleGenderChange}
            onCountriesChange={handleCountriesChange}
            onAdvantageAudienceChange={handleAdvantageAudienceChange}
            onAdvantageAgeChange={handleAdvantageAgeChange}
            onAdvantageGenderChange={handleAdvantageGenderChange}
            disabled={sectionsDisabled}
          />
        </Box>

        <Box className={styles.sectionCard}>
          <PlacementsSection />
        </Box>

        <Box className={styles.sectionCard}>
          <EuAdvertiserSection
            beneficiary={draft.dsaBeneficiary}
            payor={draft.dsaPayor}
            onBeneficiaryChange={handleDsaBeneficiaryChange}
            onPayorChange={handleDsaPayorChange}
            disabled={sectionsDisabled}
          />
        </Box>

        {error && (
          <Box className={styles.errorBox} role="alert">
            <Typography component="p" variant="inherit" className={styles.errorText}>
              {error}
            </Typography>
          </Box>
        )}
      </Box>

      <Box component="footer" className={styles.footer}>
        <Button
          type="button"
          variant="text"
          onClick={onClose}
          disabled={submitting}
          className={styles.secondaryButton}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="contained"
          disableElevation
          startIcon={<ContentCopyIcon />}
          onClick={onDuplicateClick}
          disabled={draft.name.trim().length === 0 || submitting || loading}
          className={styles.primaryButton}
        >
          {submitting ? 'Duplicating…' : 'Duplicate'}
        </Button>
      </Box>
    </Dialog>
  )
})

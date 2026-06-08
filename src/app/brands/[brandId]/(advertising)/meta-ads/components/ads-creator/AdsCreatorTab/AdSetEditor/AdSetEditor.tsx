'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CloseIcon from '@mui/icons-material/Close'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import type { DsaEntities } from '@/lib/gateways/MetaAdsGateway'
import type { BrandId } from '@/config/brands'
import SectionTitle from './SectionTitle/SectionTitle'
import SourceRows from './SourceRows/SourceRows'
import StatusToggle from '../StatusToggle/StatusToggle'
import NameSection from './NameSection/NameSection'
import BudgetScheduleSection from './BudgetScheduleSection/BudgetScheduleSection'
import AudienceSection from './AudienceSection/AudienceSection'
import DynamicCreativeSection from './DynamicCreativeSection/DynamicCreativeSection'
import EuAdvertiserSection from './EuAdvertiserSection/EuAdvertiserSection'
import ConversionSection from './ConversionSection/ConversionSection'
import PlacementsSection from './PlacementsSection/PlacementsSection'
import {
  buildAdSetName,
  buildCreatePayload,
  buildDuplicateName,
  buildDuplicatePayload,
  computeValidationErrors,
  DEFAULT_CURRENCY,
} from './helpers'
import { postAdSet } from './submitAdSet'
import { useAdSetDraft } from './useAdSetDraft'
import { useDraftHandlers } from './useDraftHandlers'
import { usePixels } from './usePixels'
import { useAdSetSource } from './useAdSetSource'
import styles from './AdSetEditor.module.css'

const EMPTY_DSA_ENTITIES: DsaEntities = { beneficiaries: [], payors: [] }

// Sales campaigns get a ready-made conversion setup so the operator doesn't
// re-pick it every time. Pixel is filled separately once datasets load.
const SALES_OBJECTIVES: ReadonlySet<string> = new Set(['OUTCOME_SALES', 'CONVERSIONS'])
const SALES_DEFAULTS = {
  destinationType: 'WEBSITE',
  optimizationGoal: 'OFFSITE_CONVERSIONS',
  customEventType: 'PURCHASE',
} as const

export type AdSetEditorMode = 'create' | 'duplicate'

interface Props {
  readonly open: boolean
  readonly onClose: () => void
  readonly onSuccess?: (newAdSetId: string, newAdSetName: string, status: 'PAUSED' | 'ACTIVE') => void
  readonly accountId: string
  readonly brandId: BrandId
  readonly mode?: AdSetEditorMode
  readonly sourceAdSetId?: string
  readonly sourceAdSetName?: string
  readonly sourceCampaignName?: string
  readonly campaignObjective?: string
  readonly accountCurrency?: string
  readonly campaignId?: string
  readonly dsaEntities?: DsaEntities
}

export default memo(function AdSetEditor({
  open,
  onClose,
  onSuccess,
  accountId,
  brandId,
  mode = 'duplicate',
  sourceAdSetId = '',
  sourceAdSetName = '',
  sourceCampaignName = '',
  campaignObjective,
  accountCurrency = DEFAULT_CURRENCY,
  campaignId = '',
  dsaEntities = EMPTY_DSA_ENTITIES,
}: Props): JSX.Element {
  const isCreate = mode === 'create'
  const fullScreen = useMediaQuery('(max-width: 600px)')
  const [draft, dispatch] = useAdSetDraft(sourceAdSetName)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [submitAttempted, setSubmitAttempted] = useState<boolean>(false)
  const isSales = isCreate && SALES_OBJECTIVES.has(campaignObjective ?? '')
  const salesPixelAppliedRef = useRef(false)

  // Reset on every open — closing the dialog discards the draft. Declared before
  // useAdSetSource so this effect runs first: reset clears the draft, then the
  // source hook hydrates it (duplicate mode). Reversing the order would wipe the
  // hydrated values.
  useEffect(() => {
    if (!open) return
    const initialName = isCreate ? '' : buildDuplicateName(sourceAdSetName)
    dispatch({ type: 'reset', initialName })
    if (isCreate) {
      // Prefill the first previously-used DSA entity as the default choice.
      const [firstBeneficiary] = dsaEntities.beneficiaries
      if (firstBeneficiary) {
        dispatch({ type: 'setDsaBeneficiary', value: firstBeneficiary })
      }
      const [firstPayor] = dsaEntities.payors
      if (firstPayor) {
        dispatch({ type: 'setDsaPayor', value: firstPayor })
      }
    }
    if (isSales) {
      dispatch({ type: 'setDestinationType', value: SALES_DEFAULTS.destinationType })
      dispatch({ type: 'setOptimizationGoal', value: SALES_DEFAULTS.optimizationGoal })
      dispatch({ type: 'setCustomEventType', value: SALES_DEFAULTS.customEventType })
    }
    salesPixelAppliedRef.current = false
    setSubmitError(null)
    setSubmitting(false)
    setSubmitAttempted(false)
  }, [open, sourceAdSetName, dispatch, isCreate, isSales, dsaEntities])

  const { pixels, pixelsLoading } = usePixels(open, accountId)
  const { source, loading, error: loadError } = useAdSetSource({
    open, isCreate, sourceAdSetId, accountId, dispatch,
  })
  const handlers = useDraftHandlers(dispatch)

  const currency = source?.currency ?? accountCurrency
  const error = submitError ?? loadError

  // Sales default: auto-select the pixel only when the account has exactly one —
  // then the choice is unambiguous. With two or more, picking pixels[0] would be a
  // silent guess (conversions could land in the wrong dataset), so leave it empty
  // and let the required-field validation force an explicit choice.
  useEffect(() => {
    if (!open || !isSales || salesPixelAppliedRef.current) return
    const [firstPixel] = pixels
    if (!firstPixel || pixels.length !== 1) return
    dispatch({ type: 'setPixelId', value: firstPixel.id })
    salesPixelAppliedRef.current = true
  }, [open, isSales, pixels, dispatch])

  const handleDuplicate = useCallback(async (): Promise<void> => {
    const trimmed = draft.name.trim()
    if (!trimmed || !sourceAdSetId || !accountId) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload = buildDuplicatePayload(draft, source, sourceAdSetId)
      const newAdSetId = await postAdSet(
        `/api/meta-ads/adsets/duplicate?accountId=${encodeURIComponent(accountId)}`,
        payload,
      )
      onSuccess?.(newAdSetId, trimmed, draft.activate ? 'ACTIVE' : 'PAUSED')
      onClose()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unknown error')
      setSubmitting(false)
    }
  }, [draft, source, sourceAdSetId, accountId, onSuccess, onClose])

  const handleCreate = useCallback(async (): Promise<void> => {
    const trimmed = draft.name.trim()
    if (!trimmed || !accountId || !campaignId) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload = buildCreatePayload(draft, accountId, campaignId)
      const newAdSetId = await postAdSet(
        `/api/meta-ads/adsets/create?accountId=${encodeURIComponent(accountId)}`,
        payload,
      )
      onSuccess?.(newAdSetId, trimmed, 'PAUSED')
      onClose()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unknown error')
      setSubmitting(false)
    }
  }, [draft, accountId, campaignId, onSuccess, onClose])

  const handleAutofillName = useCallback(() => {
    dispatch({
      type: 'setName',
      value: buildAdSetName({
        brandId,
        countries: draft.countries,
        ageMin: draft.ageMin,
        ageMax: draft.ageMax,
        gender: draft.gender,
        advantageAudience: draft.advantageAudience,
        objective: campaignObjective,
      }),
    })
  }, [
    dispatch,
    brandId,
    draft.countries,
    draft.ageMin,
    draft.ageMax,
    draft.gender,
    draft.advantageAudience,
    campaignObjective,
  ])

  const validationErrors = useMemo(() => computeValidationErrors(draft), [draft])
  const visibleErrors: Readonly<Record<string, string>> = submitAttempted ? validationErrors : {}

  const onSubmitClick = useCallback(() => {
    if (Object.keys(validationErrors).length > 0) {
      setSubmitAttempted(true)
      return
    }
    if (isCreate) {
      void handleCreate()
    } else {
      void handleDuplicate()
    }
  }, [validationErrors, isCreate, handleCreate, handleDuplicate])

  const sectionsDisabled = submitting || loading
  const submitLabelIdle = isCreate ? 'Create' : 'Duplicate'
  const submitLabelBusy = isCreate ? 'Creating…' : 'Duplicating…'
  const submitLabel = submitting ? submitLabelBusy : submitLabelIdle

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
          {isCreate
            ? <AddCircleOutlineIcon className={styles.headerIcon} fontSize="inherit" />
            : <ContentCopyIcon className={styles.headerIcon} fontSize="inherit" />}
          <Typography
            id="ad-set-editor-title"
            component="h2"
            variant="inherit"
            className={styles.headerTitle}
          >
            {isCreate ? 'Create ad set' : 'Duplicate ad set'}
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

      {error && (
        <Alert severity="error" className={styles.errorBanner}>
          {error}
        </Alert>
      )}

      <Box className={styles.body}>
        {!isCreate && (
          <SourceRows
            sourceCampaignName={sourceCampaignName}
            sourceAdSetName={sourceAdSetName}
          />
        )}

        <Box className={styles.sectionCard}>
          <SectionTitle icon={<InfoOutlinedIcon fontSize="inherit" />}>
            General
          </SectionTitle>
          <StatusToggle
            activate={draft.activate}
            onActivateChange={handlers.handleActivateChange}
            disabled={submitting}
          />
          <NameSection
            name={draft.name}
            onNameChange={handlers.handleNameChange}
            disabled={submitting}
            error={visibleErrors.name}
            onAutofill={handleAutofillName}
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
            campaignObjective={isCreate ? campaignObjective : undefined}
            locationError={visibleErrors.destinationType}
            goalError={visibleErrors.optimizationGoal}
            eventError={visibleErrors.customEventType}
            pixelError={visibleErrors.pixelId}
            onDestinationTypeChange={handlers.handleDestinationTypeChange}
            onOptimizationGoalChange={handlers.handleOptimizationGoalChange}
            onPixelIdChange={handlers.handlePixelIdChange}
            onCustomEventTypeChange={handlers.handleCustomEventTypeChange}
            onBidStrategyChange={handlers.handleBidStrategyChange}
            onBidAmountChange={handlers.handleBidAmountChange}
            onAttributionSpecChange={handlers.handleAttributionSpecChange}
            disabled={sectionsDisabled}
          />
        </Box>

        <Box className={styles.sectionCard}>
          <DynamicCreativeSection
            enabled={draft.isDynamicCreative}
            onChange={handlers.handleIsDynamicCreativeChange}
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
            onBudgetTypeChange={handlers.handleBudgetTypeChange}
            onBudgetMajorUnitsChange={handlers.handleBudgetMajorUnitsChange}
            onStartTimeChange={handlers.handleStartTimeChange}
            onEndTimeChange={handlers.handleEndTimeChange}
            disabled={sectionsDisabled}
            budgetError={visibleErrors.budget}
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
            onAgeChange={handlers.handleAgeChange}
            onGenderChange={handlers.handleGenderChange}
            onCountriesChange={handlers.handleCountriesChange}
            onAdvantageAudienceChange={handlers.handleAdvantageAudienceChange}
            onAdvantageAgeChange={handlers.handleAdvantageAgeChange}
            onAdvantageGenderChange={handlers.handleAdvantageGenderChange}
            disabled={sectionsDisabled}
            countriesError={visibleErrors.countries}
          />
        </Box>

        <Box className={styles.sectionCard}>
          <PlacementsSection />
        </Box>

        <Box className={styles.sectionCard}>
          <EuAdvertiserSection
            beneficiary={draft.dsaBeneficiary}
            payor={draft.dsaPayor}
            beneficiaryOptions={dsaEntities.beneficiaries}
            payorOptions={dsaEntities.payors}
            onBeneficiaryChange={handlers.handleDsaBeneficiaryChange}
            onPayorChange={handlers.handleDsaPayorChange}
            disabled={sectionsDisabled}
            beneficiaryError={visibleErrors.dsaBeneficiary}
            payorError={visibleErrors.dsaPayor}
          />
        </Box>
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
          startIcon={isCreate ? <AddCircleOutlineIcon /> : <ContentCopyIcon />}
          onClick={onSubmitClick}
          disabled={submitting || loading}
          className={styles.primaryButton}
        >
          {submitLabel}
        </Button>
      </Box>
    </Dialog>
  )
})

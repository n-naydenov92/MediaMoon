'use client'

import { memo, useEffect, useState } from 'react'
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
  PlacementSelection,
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
import {
  attributionSpecEqual,
  attributionSpecToPayload,
  buildDuplicateName,
  buildGeoLocations,
  buildPlacementsForTargeting,
  buildTargetingAutomation,
  countriesEqual,
  genderToMetaArray,
  placementsEqual,
} from './helpers'
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

interface DuplicateRequestPayload {
  readonly adSetId: string
  readonly newName: string
  readonly status: 'PAUSED' | 'ACTIVE'
  budgetType?: BudgetType
  budgetMinorUnits?: number
  startTime?: string
  endTime?: string
  targeting?: Record<string, unknown>
  isDynamicCreative?: boolean
  dsaBeneficiary?: string
  dsaPayor?: string
  optimizationGoal?: string
  bidStrategy?: string
  bidAmountMinorUnits?: number
  destinationType?: string
  promotedObject?: Record<string, unknown>
  attributionSpec?: readonly { event_type: string; window_days: number }[]
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
  const [name, setName] = useState<string>('')
  const [activate, setActivate] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [source, setSource] = useState<AdSetDetail | null>(null)
  const [budgetType, setBudgetType] = useState<BudgetType>('DAILY')
  const [budgetMajorUnits, setBudgetMajorUnits] = useState<number>(0)
  const [startTime, setStartTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')
  const [currency, setCurrency] = useState<string>('USD')
  const [ageMin, setAgeMin] = useState<number>(18)
  const [ageMax, setAgeMax] = useState<number>(65)
  const [gender, setGender] = useState<Gender>('ALL')
  const [isDynamicCreative, setIsDynamicCreative] = useState<boolean>(false)
  const [dsaBeneficiary, setDsaBeneficiary] = useState<string>('')
  const [dsaPayor, setDsaPayor] = useState<string>('')
  const [optimizationGoal, setOptimizationGoal] = useState<string>('')
  const [bidStrategy, setBidStrategy] = useState<string>('')
  const [bidAmountMajorUnits, setBidAmountMajorUnits] = useState<number>(0)
  const [destinationType, setDestinationType] = useState<string>('')
  const [pixelId, setPixelId] = useState<string>('')
  const [customEventType, setCustomEventType] = useState<string>('')
  const [pixels, setPixels] = useState<readonly Pixel[]>([])
  const [pixelsLoading, setPixelsLoading] = useState<boolean>(false)
  const [countries, setCountries] = useState<readonly string[]>([])
  const [advantageAudience, setAdvantageAudience] = useState<boolean>(false)
  const [advantageAge, setAdvantageAge] = useState<boolean>(false)
  const [advantageGender, setAdvantageGender] = useState<boolean>(false)
  const [attributionSpec, setAttributionSpec] = useState<readonly AttributionWindow[]>([])

  useEffect(() => {
    if (!open) return
    setName(buildDuplicateName(sourceAdSetName))
    setActivate(false)
    setError(null)
    setSubmitting(false)
    setSource(null)
    setBudgetType('DAILY')
    setBudgetMajorUnits(0)
    setStartTime('')
    setEndTime('')
    setCurrency('USD')
    setAgeMin(18)
    setAgeMax(65)
    setGender('ALL')
    setIsDynamicCreative(false)
    setDsaBeneficiary('')
    setDsaPayor('')
    setOptimizationGoal('')
    setBidStrategy('')
    setBidAmountMajorUnits(0)
    setDestinationType('')
    setPixelId('')
    setCustomEventType('')
    setPixels([])
    setPixelsLoading(false)
    setCountries([])
    setAdvantageAudience(false)
    setAdvantageAge(false)
    setAdvantageGender(false)
    setAttributionSpec([])

    if (!sourceAdSetId || !accountId) {
      return
    }

    const controller = new AbortController()
    const pixelsController = new AbortController()
    setLoading(true)
    setPixelsLoading(true)

    fetch(
      `/api/meta-ads/pixels?accountId=${encodeURIComponent(accountId)}`,
      { signal: pixelsController.signal },
    )
      .then(async (response): Promise<FetchPixelsResponse> => {
        const json = (await response.json().catch(() => ({}))) as FetchPixelsResponse
        if (!response.ok || !json.result) {
          return { result: [] }
        }
        return json
      })
      .then((json) => {
        setPixels(json.result ?? [])
      })
      .catch(() => {
        // pixels are optional — silently empty
      })
      .finally(() => {
        setPixelsLoading(false)
      })

    fetch(
      `/api/meta-ads/adsets/${encodeURIComponent(sourceAdSetId)}?accountId=${encodeURIComponent(accountId)}`,
      { signal: controller.signal },
    )
      .then(async (response): Promise<FetchAdSetResponse> => {
        const json = (await response.json().catch(() => ({}))) as FetchAdSetResponse
        if (!response.ok || !json.result) {
          throw new Error(json.error ?? `HTTP ${response.status}`)
        }
        return json
      })
      .then((json) => {
        if (!json.result) return
        const detail = json.result
        const rawDest = detail.destinationType
        const looksLikeWebsite = (!rawDest || rawDest === 'UNDEFINED')
          && (detail.pixelId !== '' || detail.customEventType !== '')
        const normalizedDest = looksLikeWebsite ? 'WEBSITE' : rawDest
        const normalizedBidStrategy = detail.bidStrategy || 'LOWEST_COST_WITHOUT_CAP'
        setSource({
          ...detail,
          destinationType: normalizedDest,
          bidStrategy: normalizedBidStrategy,
        })
        setBudgetType(detail.budgetType)
        setBudgetMajorUnits(detail.budgetMinorUnits / 100)
        setStartTime(detail.startTime ?? '')
        setEndTime(detail.endTime ?? '')
        setCurrency(detail.currency)
        setAgeMin(detail.targeting.ageMin)
        setAgeMax(detail.targeting.ageMax)
        setGender(detail.targeting.gender)
        setIsDynamicCreative(detail.isDynamicCreative)
        setDsaBeneficiary(detail.dsaBeneficiary)
        setDsaPayor(detail.dsaPayor)
        setOptimizationGoal(detail.optimizationGoal)
        setBidStrategy(normalizedBidStrategy)
        setBidAmountMajorUnits(detail.bidAmountMinorUnits / 100)
        setDestinationType(normalizedDest)
        setPixelId(detail.pixelId)
        setCustomEventType(detail.customEventType)
        setCountries(detail.targeting.countries)
        setAdvantageAudience(detail.targeting.advantageAudience)
        setAdvantageAge(detail.targeting.advantageAge)
        setAdvantageGender(detail.targeting.advantageGender)
        setAttributionSpec(detail.attributionSpec)
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Failed to load ad set')
      })
      .finally(() => {
        setLoading(false)
      })

    return () => {
      controller.abort()
      pixelsController.abort()
    }
  }, [open, sourceAdSetId, sourceAdSetName, accountId])

  const handleDuplicate = async (): Promise<void> => {
    const trimmed = name.trim()
    if (!trimmed || !sourceAdSetId || !accountId) {
      return
    }
    setSubmitting(true)
    setError(null)

    const payload: DuplicateRequestPayload = {
      adSetId: sourceAdSetId,
      newName: trimmed,
      status: activate ? 'ACTIVE' : 'PAUSED',
    }

    if (source) {
      const budgetMinorUnits = Math.round(budgetMajorUnits * 100)
      const budgetChanged = source.budgetType !== budgetType || source.budgetMinorUnits !== budgetMinorUnits
      if (budgetChanged) {
        payload.budgetType = budgetType
        payload.budgetMinorUnits = budgetMinorUnits
      }
      const stateStartTs = Date.parse(startTime)
      const stateStartIsFuture = Number.isFinite(stateStartTs) && stateStartTs > Date.now()
      payload.startTime = stateStartIsFuture
        ? startTime
        : new Date(Date.now() + 60 * 1000).toISOString()

      const sourceEnd = source.endTime ?? ''
      if (sourceEnd !== endTime) {
        const ts = Date.parse(endTime)
        if (Number.isFinite(ts) && ts > Date.now()) {
          payload.endTime = endTime
        }
      }
      const ageChanged = source.targeting.ageMin !== ageMin || source.targeting.ageMax !== ageMax
      const genderChanged = source.targeting.gender !== gender
      const countriesChanged = !countriesEqual(source.targeting.countries, countries)
      const advantageChanged = source.targeting.advantageAudience !== advantageAudience
        || source.targeting.advantageAge !== advantageAge
        || source.targeting.advantageGender !== advantageGender
      const currentPlacements: PlacementSelection = {
        mode: 'ADVANTAGE_PLUS',
        deviceMode: 'ALL',
        publisherPlatforms: [],
        facebookPositions: [],
        instagramPositions: [],
        audienceNetworkPositions: [],
        messengerPositions: [],
      }
      const placementsChanged = !placementsEqual(source.placements, currentPlacements)
      if (ageChanged || genderChanged || countriesChanged || advantageChanged || placementsChanged) {
        const targetingPayload: Record<string, unknown> = {
          ...source.rawTargeting,
          age_min: ageMin,
          age_max: ageMax,
          genders: genderToMetaArray(gender),
          geo_locations: buildGeoLocations(source.rawTargeting, countries),
          targeting_automation: buildTargetingAutomation(
            source.rawTargeting,
            advantageAudience,
            advantageAge,
            advantageGender,
          ),
          ...buildPlacementsForTargeting(currentPlacements),
        }
        if (!advantageAudience) {
          delete targetingPayload.age_range
        }
        payload.targeting = targetingPayload
      }
      if (source.isDynamicCreative !== isDynamicCreative) {
        payload.isDynamicCreative = isDynamicCreative
      }
      if (source.dsaBeneficiary !== dsaBeneficiary) {
        payload.dsaBeneficiary = dsaBeneficiary
      }
      if (source.dsaPayor !== dsaPayor) {
        payload.dsaPayor = dsaPayor
      }
      if (source.optimizationGoal !== optimizationGoal) {
        payload.optimizationGoal = optimizationGoal
      }
      if (source.bidStrategy !== bidStrategy) {
        payload.bidStrategy = bidStrategy
      }
      const bidAmountMinorUnits = Math.round(bidAmountMajorUnits * 100)
      if (source.bidAmountMinorUnits !== bidAmountMinorUnits) {
        payload.bidAmountMinorUnits = bidAmountMinorUnits
      }
      if (source.destinationType !== destinationType) {
        payload.destinationType = destinationType
      }
      const pixelChanged = source.pixelId !== pixelId
      const eventChanged = source.customEventType !== customEventType
      if (pixelChanged || eventChanged) {
        payload.promotedObject = {
          ...source.rawPromotedObject,
          pixel_id: pixelId,
          custom_event_type: customEventType,
        }
      }
      if (!attributionSpecEqual(source.attributionSpec, attributionSpec)) {
        payload.attributionSpec = attributionSpecToPayload(attributionSpec)
      }
    }

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
      onSuccess?.(json.result.adSetId, trimmed, activate ? 'ACTIVE' : 'PAUSED')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setSubmitting(false)
    }
  }

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
            activate={activate}
            onActivateChange={setActivate}
            disabled={submitting}
          />
          <NameSection
            name={name}
            onNameChange={setName}
            disabled={submitting}
          />
        </Box>

        <Box className={styles.sectionCard}>
          <ConversionSection
            destinationType={destinationType}
            optimizationGoal={optimizationGoal}
            pixelId={pixelId}
            customEventType={customEventType}
            bidStrategy={bidStrategy}
            bidAmountMajorUnits={bidAmountMajorUnits}
            currency={currency}
            pixels={pixels}
            pixelsLoading={pixelsLoading}
            attributionSpec={attributionSpec}
            onDestinationTypeChange={setDestinationType}
            onOptimizationGoalChange={setOptimizationGoal}
            onPixelIdChange={setPixelId}
            onCustomEventTypeChange={setCustomEventType}
            onBidStrategyChange={setBidStrategy}
            onBidAmountChange={setBidAmountMajorUnits}
            onAttributionSpecChange={setAttributionSpec}
            disabled={sectionsDisabled}
          />
        </Box>

        <Box className={styles.sectionCard}>
          <DynamicCreativeSection
            enabled={isDynamicCreative}
            onChange={setIsDynamicCreative}
            disabled={sectionsDisabled}
          />
        </Box>

        <Box className={styles.sectionCard}>
          <BudgetScheduleSection
            budgetType={budgetType}
            budgetMajorUnits={budgetMajorUnits}
            startTime={startTime}
            endTime={endTime}
            currency={currency}
            onBudgetTypeChange={setBudgetType}
            onBudgetMajorUnitsChange={setBudgetMajorUnits}
            onStartTimeChange={setStartTime}
            onEndTimeChange={setEndTime}
            disabled={sectionsDisabled}
          />
        </Box>

        <Box className={styles.sectionCard}>
          <AudienceSection
            ageMin={ageMin}
            ageMax={ageMax}
            gender={gender}
            countries={countries}
            advantageAudience={advantageAudience}
            advantageAge={advantageAge}
            advantageGender={advantageGender}
            onAgeChange={(min, max) => {
              setAgeMin(min)
              setAgeMax(max)
            }}
            onGenderChange={setGender}
            onCountriesChange={setCountries}
            onAdvantageAudienceChange={setAdvantageAudience}
            onAdvantageAgeChange={setAdvantageAge}
            onAdvantageGenderChange={setAdvantageGender}
            disabled={sectionsDisabled}
          />
        </Box>

        <Box className={styles.sectionCard}>
          <PlacementsSection />
        </Box>

        <Box className={styles.sectionCard}>
          <EuAdvertiserSection
            beneficiary={dsaBeneficiary}
            payor={dsaPayor}
            onBeneficiaryChange={setDsaBeneficiary}
            onPayorChange={setDsaPayor}
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
          onClick={() => {
            void handleDuplicate()
          }}
          disabled={name.trim().length === 0 || submitting || loading}
          className={styles.primaryButton}
        >
          {submitting ? 'Duplicating…' : 'Duplicate'}
        </Button>
      </Box>
    </Dialog>
  )
})

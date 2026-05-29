import type {
  AdSetDetail,
  AttributionWindow,
  BudgetType,
  DeviceMode,
  Gender,
  PlacementSelection,
} from '@/lib/gateways/MetaAdsGateway'
import type { DraftState } from './useAdSetDraft'

// Meta refuses start_time<=now; small buffer covers clock skew + request travel.
const START_TIME_GRACE_MS = 60_000

export interface DuplicateRequestPayload {
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

export function buildDuplicateName(sourceName: string, now: Date = new Date()): string {
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${sourceName} — ${yyyy}-${mm}-${dd}`
}

export function genderToMetaArray(gender: Gender): readonly number[] {
  if (gender === 'MEN') {
    return [1]
  }
  if (gender === 'WOMEN') {
    return [2]
  }
  return []
}

export function buildGeoLocations(
  rawTargeting: Readonly<Record<string, unknown>>,
  countries: readonly string[],
): Record<string, unknown> {
  const existing = rawTargeting.geo_locations
  const base: Record<string, unknown> = (existing && typeof existing === 'object')
    ? { ...(existing as Record<string, unknown>) }
    : { location_types: ['home', 'recent'] }
  base.countries = [...countries]
  return base
}

export function buildTargetingAutomation(
  rawTargeting: Readonly<Record<string, unknown>>,
  advantageAudience: boolean,
  advantageAge: boolean,
  advantageGender: boolean,
): Record<string, unknown> {
  const existing = rawTargeting.targeting_automation
  const base = (existing && typeof existing === 'object')
    ? { ...(existing as Record<string, unknown>) }
    : {}
  base.advantage_audience = advantageAudience ? 1 : 0
  const individualBase = (base.individual_setting && typeof base.individual_setting === 'object')
    ? { ...(base.individual_setting as Record<string, unknown>) }
    : {}
  individualBase.age = advantageAge ? 1 : 0
  individualBase.gender = advantageGender ? 1 : 0
  base.individual_setting = individualBase
  return base
}

export function attributionSpecToPayload(
  spec: readonly AttributionWindow[],
): readonly { event_type: string; window_days: number }[] {
  return spec.map((w) => ({ event_type: w.eventType, window_days: w.windowDays }))
}

export function attributionSpecEqual(
  a: readonly AttributionWindow[],
  b: readonly AttributionWindow[],
): boolean {
  if (a.length !== b.length) return false
  const key = (w: AttributionWindow): string => `${w.eventType}:${w.windowDays}`
  const aKeys = a.map(key).sort()
  const bKeys = b.map(key).sort()
  return aKeys.every((k, i) => k === bKeys[i])
}

export function stringArraysEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false
  const aSorted = [...a].sort()
  const bSorted = [...b].sort()
  return aSorted.every((v, i) => v === bSorted[i])
}

export function placementsEqual(a: PlacementSelection, b: PlacementSelection): boolean {
  if (a.mode !== b.mode) return false
  if (a.deviceMode !== b.deviceMode) return false
  return stringArraysEqual(a.publisherPlatforms, b.publisherPlatforms)
    && stringArraysEqual(a.facebookPositions, b.facebookPositions)
    && stringArraysEqual(a.instagramPositions, b.instagramPositions)
    && stringArraysEqual(a.audienceNetworkPositions, b.audienceNetworkPositions)
    && stringArraysEqual(a.messengerPositions, b.messengerPositions)
}

function deviceModeToArray(mode: DeviceMode): readonly string[] {
  if (mode === 'MOBILE') return ['mobile']
  if (mode === 'DESKTOP') return ['desktop']
  return ['mobile', 'desktop']
}

export function buildPlacementsForTargeting(p: PlacementSelection): Record<string, unknown> {
  const out: Record<string, unknown> = {
    device_platforms: deviceModeToArray(p.deviceMode),
  }
  if (p.mode === 'ADVANTAGE_PLUS') {
    out.publisher_platforms = []
    out.facebook_positions = []
    out.instagram_positions = []
    out.audience_network_positions = []
    out.messenger_positions = []
  } else {
    out.publisher_platforms = [...p.publisherPlatforms]
    out.facebook_positions = [...p.facebookPositions]
    out.instagram_positions = [...p.instagramPositions]
    out.audience_network_positions = [...p.audienceNetworkPositions]
    out.messenger_positions = [...p.messengerPositions]
  }
  return out
}

const ADVANTAGE_PLUS_PLACEMENT: PlacementSelection = {
  mode: 'ADVANTAGE_PLUS',
  deviceMode: 'ALL',
  publisherPlatforms: [],
  facebookPositions: [],
  instagramPositions: [],
  audienceNetworkPositions: [],
  messengerPositions: [],
}

export function buildDuplicatePayload(
  draft: DraftState,
  source: AdSetDetail | null,
  adSetId: string,
  now: number = Date.now(),
): DuplicateRequestPayload {
  const trimmedName = draft.name.trim()
  const payload: DuplicateRequestPayload = {
    adSetId,
    newName: trimmedName,
    status: draft.activate ? 'ACTIVE' : 'PAUSED',
  }

  if (!source) {
    return payload
  }

  // CBO: budget is owned by the campaign, never patch it on the ad set.
  const cbo = source.campaignBudget !== null && source.budgetMinorUnits === 0
  if (!cbo) {
    const budgetMinorUnits = Math.round(draft.budgetMajorUnits * 100)
    if (source.budgetType !== draft.budgetType || source.budgetMinorUnits !== budgetMinorUnits) {
      payload.budgetType = draft.budgetType
      payload.budgetMinorUnits = budgetMinorUnits
    }
  }

  const stateStartTs = Date.parse(draft.startTime)
  const stateStartIsFuture = Number.isFinite(stateStartTs) && stateStartTs > now
  payload.startTime = stateStartIsFuture
    ? draft.startTime
    : new Date(now + START_TIME_GRACE_MS).toISOString()

  if ((source.endTime ?? '') !== draft.endTime) {
    const ts = Date.parse(draft.endTime)
    if (Number.isFinite(ts) && ts > now) {
      payload.endTime = draft.endTime
    }
  }

  const ageChanged = source.targeting.ageMin !== draft.ageMin
    || source.targeting.ageMax !== draft.ageMax
  const genderChanged = source.targeting.gender !== draft.gender
  const countriesChanged = !stringArraysEqual(source.targeting.countries, draft.countries)
  const advantageChanged = source.targeting.advantageAudience !== draft.advantageAudience
    || source.targeting.advantageAge !== draft.advantageAge
    || source.targeting.advantageGender !== draft.advantageGender
  const placementsChanged = !placementsEqual(source.placements, ADVANTAGE_PLUS_PLACEMENT)
  if (ageChanged || genderChanged || countriesChanged || advantageChanged || placementsChanged) {
    const targetingPayload: Record<string, unknown> = {
      ...source.rawTargeting,
      age_min: draft.ageMin,
      age_max: draft.ageMax,
      genders: genderToMetaArray(draft.gender),
      geo_locations: buildGeoLocations(source.rawTargeting, draft.countries),
      targeting_automation: buildTargetingAutomation(
        source.rawTargeting,
        draft.advantageAudience,
        draft.advantageAge,
        draft.advantageGender,
      ),
      ...buildPlacementsForTargeting(ADVANTAGE_PLUS_PLACEMENT),
    }
    // age_range requires advantage_audience enabled; Meta rejects otherwise.
    if (!draft.advantageAudience) {
      delete targetingPayload.age_range
    }
    payload.targeting = targetingPayload
  }

  if (source.isDynamicCreative !== draft.isDynamicCreative) {
    payload.isDynamicCreative = draft.isDynamicCreative
  }
  if (source.dsaBeneficiary !== draft.dsaBeneficiary) {
    payload.dsaBeneficiary = draft.dsaBeneficiary
  }
  if (source.dsaPayor !== draft.dsaPayor) {
    payload.dsaPayor = draft.dsaPayor
  }
  if (source.optimizationGoal !== draft.optimizationGoal) {
    payload.optimizationGoal = draft.optimizationGoal
  }
  if (source.bidStrategy !== draft.bidStrategy) {
    payload.bidStrategy = draft.bidStrategy
  }
  const bidAmountMinorUnits = Math.round(draft.bidAmountMajorUnits * 100)
  if (source.bidAmountMinorUnits !== bidAmountMinorUnits) {
    payload.bidAmountMinorUnits = bidAmountMinorUnits
  }
  if (source.destinationType !== draft.destinationType) {
    payload.destinationType = draft.destinationType
  }
  if (source.pixelId !== draft.pixelId || source.customEventType !== draft.customEventType) {
    payload.promotedObject = {
      ...source.rawPromotedObject,
      pixel_id: draft.pixelId,
      custom_event_type: draft.customEventType,
    }
  }
  if (!attributionSpecEqual(source.attributionSpec, draft.attributionSpec)) {
    payload.attributionSpec = attributionSpecToPayload(draft.attributionSpec)
  }

  return payload
}

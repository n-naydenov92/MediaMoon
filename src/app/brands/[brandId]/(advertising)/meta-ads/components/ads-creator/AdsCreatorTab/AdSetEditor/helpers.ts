import type { AttributionWindow, DeviceMode, Gender, PlacementSelection } from '@/lib/gateways/MetaAdsGateway'

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

export function countriesEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false
  const aSorted = [...a].slice().sort()
  const bSorted = [...b].slice().sort()
  return aSorted.every((v, i) => v === bSorted[i])
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

function stringArraysEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false
  const aSorted = [...a].slice().sort()
  const bSorted = [...b].slice().sort()
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

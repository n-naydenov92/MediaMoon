import { normalizeAccountId } from '@/config/metaBusinessManagers'
import { buildUrl, callGraphApi } from './http'
import type {
  AdSetDetail,
  AttributionEventType,
  AttributionWindow,
  BudgetType,
  CampaignBudget,
  DeviceMode,
  Gender,
  PlacementSelection,
  Pixel,
  TargetingBasics,
} from './types'

interface GraphPixelRaw {
  id: string
  name: string
}

interface GraphListResponse<T> {
  data: T[]
  error?: { code: number; message: string; type: string }
}

interface GraphCampaignBudgetRaw {
  id?: string
  daily_budget?: string
  lifetime_budget?: string
}

interface GraphAdSetDetailRaw {
  id: string
  name: string
  status: string
  effective_status: string
  daily_budget?: string
  lifetime_budget?: string
  start_time?: string
  end_time?: string
  account_id?: string
  targeting?: Record<string, unknown>
  is_dynamic_creative?: boolean
  dsa_beneficiary?: string
  dsa_payor?: string
  optimization_goal?: string
  bid_strategy?: string
  bid_amount?: string
  destination_type?: string
  promoted_object?: Record<string, unknown>
  attribution_spec?: readonly { event_type?: string; window_days?: number }[]
  campaign?: GraphCampaignBudgetRaw
  error?: { code: number; message: string; type: string }
}

interface GraphAccountCurrencyRaw {
  currency?: string
  error?: { code: number; message: string; type: string }
}

export async function fetchAdSet(token: string, adSetId: string): Promise<AdSetDetail> {
  const adSetUrl = buildUrl(`/${adSetId}`, token, {
    fields: 'id,name,status,effective_status,daily_budget,lifetime_budget,start_time,end_time,account_id,targeting,is_dynamic_creative,dsa_beneficiary,dsa_payor,optimization_goal,bid_strategy,bid_amount,destination_type,promoted_object,attribution_spec,campaign{id,daily_budget,lifetime_budget}',
  })
  const adSetJson = await callGraphApi<GraphAdSetDetailRaw>(adSetUrl)
  if (adSetJson.error) {
    throw new Error(`Meta API error ${adSetJson.error.code}: ${adSetJson.error.message}`)
  }

  let currency = 'USD'
  const rawAccountId = adSetJson.account_id ?? ''
  if (rawAccountId) {
    const accountPath = normalizeAccountId(rawAccountId)
    const accountUrl = buildUrl(`/${accountPath}`, token, { fields: 'currency' })
    try {
      const accountJson = await callGraphApi<GraphAccountCurrencyRaw>(accountUrl)
      if (accountJson.currency) {
        currency = accountJson.currency
      }
    } catch {
      // currency stays at default 'USD'
    }
  }

  return toAdSetDetail(adSetJson, currency)
}

function toGender(genders: unknown): Gender {
  if (!Array.isArray(genders) || genders.length === 0 || genders.length === 2) {
    return 'ALL'
  }
  if (genders[0] === 1) {
    return 'MEN'
  }
  if (genders[0] === 2) {
    return 'WOMEN'
  }
  return 'ALL'
}

function toCountries(raw: Record<string, unknown>): readonly string[] {
  const geo = raw.geo_locations
  if (!geo || typeof geo !== 'object') return []
  const { countries } = geo as Record<string, unknown>
  if (!Array.isArray(countries)) return []
  return countries.filter((c): c is string => typeof c === 'string')
}

function toAdvantageFlags(raw: Record<string, unknown>): {
  advantageAudience: boolean
  advantageAge: boolean
  advantageGender: boolean
} {
  const automation = raw.targeting_automation
  if (!automation || typeof automation !== 'object') {
    return { advantageAudience: false, advantageAge: false, advantageGender: false }
  }
  const a = automation as Record<string, unknown>
  const individual = (a.individual_setting && typeof a.individual_setting === 'object')
    ? (a.individual_setting as Record<string, unknown>)
    : {}
  return {
    advantageAudience: a.advantage_audience === 1 || a.advantage_audience === true,
    advantageAge: individual.age === 1 || individual.age === true,
    advantageGender: individual.gender === 1 || individual.gender === true,
  }
}

function toTargetingBasics(raw: Record<string, unknown>): TargetingBasics {
  const ageMin = typeof raw.age_min === 'number' ? raw.age_min : 18
  const ageMax = typeof raw.age_max === 'number' ? raw.age_max : 65
  const flags = toAdvantageFlags(raw)
  return {
    ageMin,
    ageMax,
    gender: toGender(raw.genders),
    countries: toCountries(raw),
    ...flags,
  }
}

const ATTRIBUTION_EVENT_TYPES: readonly AttributionEventType[] = [
  'CLICK_THROUGH',
  'VIEW_THROUGH',
  'ENGAGED_VIDEO_VIEW',
]

function toStringArray(raw: unknown): readonly string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((x): x is string => typeof x === 'string')
}

function toDeviceMode(raw: Record<string, unknown>): DeviceMode {
  const arr = toStringArray(raw.device_platforms)
  if (arr.length === 0 || (arr.includes('mobile') && arr.includes('desktop'))) {
    return 'ALL'
  }
  if (arr.includes('mobile')) return 'MOBILE'
  if (arr.includes('desktop')) return 'DESKTOP'
  return 'ALL'
}

function toPlacementSelection(raw: Record<string, unknown>): PlacementSelection {
  const publisherPlatforms = toStringArray(raw.publisher_platforms)
  const facebookPositions = toStringArray(raw.facebook_positions)
  const instagramPositions = toStringArray(raw.instagram_positions)
  const audienceNetworkPositions = toStringArray(raw.audience_network_positions)
  const messengerPositions = toStringArray(raw.messenger_positions)
  const hasAnyManual = publisherPlatforms.length > 0
    || facebookPositions.length > 0
    || instagramPositions.length > 0
    || audienceNetworkPositions.length > 0
    || messengerPositions.length > 0
  return {
    mode: hasAnyManual ? 'MANUAL' : 'ADVANTAGE_PLUS',
    deviceMode: toDeviceMode(raw),
    publisherPlatforms,
    facebookPositions,
    instagramPositions,
    audienceNetworkPositions,
    messengerPositions,
  }
}

function toAttributionSpec(
  raw: readonly { event_type?: string; window_days?: number }[] | undefined,
): readonly AttributionWindow[] {
  if (!Array.isArray(raw)) return []
  const out: AttributionWindow[] = []
  for (const item of raw) {
    if (!item || typeof item.event_type !== 'string') continue
    if (typeof item.window_days !== 'number') continue
    if (!ATTRIBUTION_EVENT_TYPES.includes(item.event_type as AttributionEventType)) continue
    out.push({ eventType: item.event_type as AttributionEventType, windowDays: item.window_days })
  }
  return out
}

function toCampaignBudget(campaign: GraphCampaignBudgetRaw | undefined): CampaignBudget | null {
  if (!campaign) return null
  const daily = campaign.daily_budget ? parseInt(campaign.daily_budget, 10) : 0
  const lifetime = campaign.lifetime_budget ? parseInt(campaign.lifetime_budget, 10) : 0
  if (daily === 0 && lifetime === 0) return null
  if (lifetime > 0) return { type: 'LIFETIME', minorUnits: lifetime }
  return { type: 'DAILY', minorUnits: daily }
}

function toAdSetDetail(raw: GraphAdSetDetailRaw, currency: string): AdSetDetail {
  const daily = raw.daily_budget ? parseInt(raw.daily_budget, 10) : 0
  const lifetime = raw.lifetime_budget ? parseInt(raw.lifetime_budget, 10) : 0
  const budgetType: BudgetType = lifetime > 0 ? 'LIFETIME' : 'DAILY'
  const budgetMinorUnits = budgetType === 'LIFETIME' ? lifetime : daily
  const rawTargeting = raw.targeting ?? {}
  return {
    id: raw.id,
    name: raw.name,
    status: raw.status,
    effectiveStatus: raw.effective_status,
    budgetType,
    budgetMinorUnits,
    campaignBudget: toCampaignBudget(raw.campaign),
    startTime: raw.start_time ?? null,
    endTime: raw.end_time ?? null,
    accountId: raw.account_id ?? '',
    currency,
    targeting: toTargetingBasics(rawTargeting),
    rawTargeting,
    isDynamicCreative: raw.is_dynamic_creative === true,
    dsaBeneficiary: raw.dsa_beneficiary ?? '',
    dsaPayor: raw.dsa_payor ?? '',
    optimizationGoal: raw.optimization_goal ?? '',
    bidStrategy: raw.bid_strategy ?? '',
    bidAmountMinorUnits: raw.bid_amount ? parseInt(raw.bid_amount, 10) : 0,
    destinationType: raw.destination_type ?? '',
    pixelId: typeof raw.promoted_object?.pixel_id === 'string' ? raw.promoted_object.pixel_id : '',
    customEventType: typeof raw.promoted_object?.custom_event_type === 'string' ? raw.promoted_object.custom_event_type : '',
    rawPromotedObject: raw.promoted_object ?? {},
    attributionSpec: toAttributionSpec(raw.attribution_spec),
    placements: toPlacementSelection(rawTargeting),
  }
}

export async function fetchPixels(token: string, accountId: string): Promise<readonly Pixel[]> {
  const accountPath = normalizeAccountId(accountId)
  const url = buildUrl(`/${accountPath}/adspixels`, token, {
    fields: 'id,name',
    limit: '100',
  })
  const json = await callGraphApi<GraphListResponse<GraphPixelRaw>>(url)
  if (json.error) {
    throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  }
  return (json.data ?? []).map((raw) => ({ id: raw.id, name: raw.name }))
}

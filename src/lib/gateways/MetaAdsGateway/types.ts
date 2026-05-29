export interface AdAccount {
  readonly id: string
  readonly name: string
  readonly accountStatus: number
  readonly currency: string
  readonly timezoneName: string
}

export interface Campaign {
  readonly id: string
  readonly name: string
  readonly status: string
  readonly effectiveStatus: string
}

export interface AdSet {
  readonly id: string
  readonly name: string
  readonly status: string
  readonly effectiveStatus: string
}

export type BudgetType = 'DAILY' | 'LIFETIME'

export type Gender = 'ALL' | 'MEN' | 'WOMEN'

export interface TargetingBasics {
  readonly ageMin: number
  readonly ageMax: number
  readonly gender: Gender
  readonly countries: readonly string[]
  readonly advantageAudience: boolean
  readonly advantageAge: boolean
  readonly advantageGender: boolean
}

export type AttributionEventType = 'CLICK_THROUGH' | 'VIEW_THROUGH' | 'ENGAGED_VIDEO_VIEW'

export interface AttributionWindow {
  readonly eventType: AttributionEventType
  readonly windowDays: number
}

export type DeviceMode = 'ALL' | 'MOBILE' | 'DESKTOP'

export interface PlacementSelection {
  readonly mode: 'ADVANTAGE_PLUS' | 'MANUAL'
  readonly deviceMode: DeviceMode
  readonly publisherPlatforms: readonly string[]
  readonly facebookPositions: readonly string[]
  readonly instagramPositions: readonly string[]
  readonly audienceNetworkPositions: readonly string[]
  readonly messengerPositions: readonly string[]
}

export interface AdSetDetail {
  readonly id: string
  readonly name: string
  readonly status: string
  readonly effectiveStatus: string
  readonly budgetType: BudgetType
  readonly budgetMinorUnits: number
  readonly startTime: string | null
  readonly endTime: string | null
  readonly accountId: string
  readonly currency: string
  readonly targeting: TargetingBasics
  readonly rawTargeting: Readonly<Record<string, unknown>>
  readonly isDynamicCreative: boolean
  readonly dsaBeneficiary: string
  readonly dsaPayor: string
  readonly optimizationGoal: string
  readonly bidStrategy: string
  readonly bidAmountMinorUnits: number
  readonly destinationType: string
  readonly pixelId: string
  readonly customEventType: string
  readonly rawPromotedObject: Readonly<Record<string, unknown>>
  readonly attributionSpec: readonly AttributionWindow[]
  readonly placements: PlacementSelection
}

export interface Pixel {
  readonly id: string
  readonly name: string
}

export interface Page {
  readonly id: string
  readonly name: string
  readonly pictureUrl: string | null
}

export interface InstagramAccount {
  readonly id: string
  readonly username: string
  readonly pictureUrl: string | null
}

export const CTA_TYPES = ['LEARN_MORE', 'SHOP_NOW', 'SIGN_UP'] as const
export type CtaType = typeof CTA_TYPES[number]

export interface AdCreativeParams {
  readonly accountId: string
  readonly headline: string
  readonly bodyText: string
  readonly description?: string
  readonly destinationUrl: string
  readonly ctaType: CtaType
  readonly pageId: string
  readonly instagramActorId?: string
  readonly imageHash?: string
  readonly videoId?: string
  readonly thumbnailHash?: string
}

export interface PublishAdResult {
  readonly adId: string
  readonly creativeId: string
  readonly mediaHash: string | null
  readonly mediaId: string | null
}

export interface InsightsTotals {
  readonly spend: number
  readonly revenue: number
  readonly purchases: number
  readonly impressions: number
  readonly clicks: number
  readonly linkClicks: number
  readonly landingPageViews: number
  readonly addsToCart: number
  readonly checkoutsInitiated: number
}

export interface InsightsDailyPoint extends InsightsTotals {
  readonly date: string
}

export interface AccountInsights {
  readonly accountId: string
  readonly currency: string
  readonly totals: InsightsTotals
  readonly daily: readonly InsightsDailyPoint[]
}

export interface AdWithInsights {
  readonly id: string
  readonly name: string
  readonly status: string
  readonly effectiveStatus: string
  readonly creativeType: 'image' | 'video' | 'unknown'
  readonly thumbnailUrl: string | null
  readonly accountId: string
  readonly currency: string
  readonly insights: InsightsTotals
}

export interface AdInsightsFilter {
  readonly field: string
  readonly operator: 'GREATER_THAN' | 'LESS_THAN' | 'EQUAL' | 'IN'
  readonly value: number | string | readonly string[]
}

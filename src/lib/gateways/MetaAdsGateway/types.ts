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

export interface Page {
  readonly id: string
  readonly name: string
}

export interface InstagramAccount {
  readonly id: string
  readonly username: string
}

export const CTA_TYPES = ['LEARN_MORE', 'SHOP_NOW', 'SIGN_UP'] as const
export type CtaType = typeof CTA_TYPES[number]

export interface AdCreativeParams {
  readonly accountId: string
  readonly headline: string
  readonly bodyText: string
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

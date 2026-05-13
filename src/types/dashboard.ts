export interface DashboardKpis {
  readonly spend: number | null
  readonly revenue: number | null
  readonly roas: number | null
  readonly orders: number | null
  readonly aov: number | null
  readonly cpo: number | null
  readonly conversionRate: number | null
  readonly costPerUser: number | null
}

export interface DashboardKpiDeltas {
  readonly spend: number | null
  readonly revenue: number | null
  readonly roas: number | null
  readonly orders: number | null
  readonly aov: number | null
  readonly cpo: number | null
  readonly conversionRate: number | null
  readonly costPerUser: number | null
}

export interface DashboardDailyPoint {
  readonly date: string
  readonly spend: number | null
  readonly revenue: number | null
  readonly orders: number | null
  readonly sessions: number | null
  readonly activeUsers: number | null
  readonly newUsers: number | null
  readonly firstTimePurchasers: number | null
  readonly bounceRate: number | null
}

export interface DashboardTopProduct {
  readonly productId: number
  readonly title: string
  readonly quantity: number
  readonly revenue: number
  readonly anchorAov: number | null
  readonly anchorOrders: number
}

export type SpendChannel = 'meta' | 'googleAds' | 'tiktok'

export interface SpendBreakdownPoint {
  readonly channel: SpendChannel
  readonly label: string
  readonly spend: number
  readonly roas: number | null
}

export interface AdChannelStats {
  readonly wired: boolean
  readonly spend: number | null
  readonly revenue: number | null
  readonly roas: number | null
  readonly orders: number | null
  readonly cpo: number | null
  readonly ctr: number | null
  readonly checkoutRate: number | null
  readonly costPerVisitor: number | null
}

export interface KlaviyoChannelStats {
  readonly wired: boolean
  readonly sent: number | null
  readonly openRate: number | null
  readonly clickRate: number | null
  readonly attributedRevenue: number | null
  readonly attributedOrders: number | null
}

export interface DashboardChannels {
  readonly meta: AdChannelStats
  readonly googleAds: AdChannelStats
  readonly klaviyo: KlaviyoChannelStats
}

export interface MetaDailyPoint {
  readonly date: string
  readonly spend: number
  readonly revenue: number
  readonly orders: number
  readonly impressions: number
  readonly linkClicks: number
  readonly checkoutsInitiated: number
}

export interface DashboardChannelsByDay {
  readonly meta: readonly MetaDailyPoint[]
}

export interface AnalyticsKpis {
  readonly sessions: number | null
  readonly activeUsers: number | null
  readonly newUsers: number | null
  readonly firstTimePurchasers: number | null
  readonly conversionRate: number | null
  readonly bounceRate: number | null
}

export interface TrafficSourcePoint {
  readonly source: string
  readonly activeUsers: number
  readonly userShare: number
  readonly revenue: number
  readonly revenueShare: number
}

export type DeviceCategory = 'mobile' | 'desktop' | 'tablet'

export interface DeviceBreakdownPoint {
  readonly device: DeviceCategory
  readonly sessions: number
  readonly share: number
}

export interface TopLandingPage {
  readonly path: string
  readonly activeUsers: number
  readonly conversions: number
  readonly conversionRate: number
}

export interface FunnelStage {
  readonly key: 'homePage' | 'productPage' | 'addToCart' | 'initiateCheckout' | 'purchase'
  readonly label: string
  readonly activeUsers: number
  readonly stageConversion: number
}

export interface FunnelDailyPoint {
  readonly date: string
  readonly addToCartUsers: number
  readonly purchaseUsers: number
}

export interface DashboardAnalyticsData {
  readonly kpis: AnalyticsKpis
  readonly trafficSources: readonly TrafficSourcePoint[]
  readonly devices: readonly DeviceBreakdownPoint[]
  readonly topLandingPages: readonly TopLandingPage[]
  readonly funnel: readonly FunnelStage[]
  readonly funnelByDay: readonly FunnelDailyPoint[]
}

export interface CategoryBreakdownPoint {
  readonly category: string
  readonly revenue: number
  readonly share: number
}

export interface DashboardSummary {
  readonly currency: 'EUR'
  readonly kpis: DashboardKpis
  readonly previous: DashboardKpis
  readonly deltas: DashboardKpiDeltas
  readonly byDay: readonly DashboardDailyPoint[]
  readonly topProducts: readonly DashboardTopProduct[]
  readonly spendBreakdown: readonly SpendBreakdownPoint[]
  readonly fetchedAt: number
  readonly hasCommerce: boolean
  readonly hasAnalytics: boolean
  readonly channels?: DashboardChannels
  readonly previousChannels?: DashboardChannels
  readonly channelsByDay?: DashboardChannelsByDay
  readonly analytics?: DashboardAnalyticsData
  readonly previousAnalytics?: DashboardAnalyticsData
  readonly categories?: readonly CategoryBreakdownPoint[]
}

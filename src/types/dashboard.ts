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
}

export interface DashboardTopProduct {
  readonly productId: number
  readonly title: string
  readonly quantity: number
  readonly revenue: number
}

export type SpendChannel = 'meta' | 'googleAds' | 'tiktok'

export interface SpendBreakdownPoint {
  readonly channel: SpendChannel
  readonly label: string
  readonly spend: number
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
}

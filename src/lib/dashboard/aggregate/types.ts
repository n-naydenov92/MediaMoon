export interface CommerceTotals {
  readonly revenueEur: number
  readonly ordersCount: number
  readonly byDay: readonly { readonly date: string; readonly revenueEur: number; readonly orders: number }[]
}

export interface SpendTotals {
  readonly spendEur: number
  readonly byDay: readonly { readonly date: string; readonly spendEur: number }[]
}

export interface MetaChannelDailyPoint {
  readonly date: string
  readonly spendEur: number
  readonly revenueEur: number
  readonly purchases: number
  readonly impressions: number
  readonly linkClicks: number
  readonly checkoutsInitiated: number
}

export interface MetaChannelTotals {
  readonly spendEur: number
  readonly revenueEur: number
  readonly purchases: number
  readonly impressions: number
  readonly linkClicks: number
  readonly checkoutsInitiated: number
  readonly byDay: readonly MetaChannelDailyPoint[]
}

export interface AnalyticsTotalsForAggregate {
  readonly sessions: number
  readonly activeUsers: number
  readonly byDay: readonly {
    readonly date: string
    readonly sessions: number
    readonly activeUsers: number
    readonly newUsers: number
    readonly firstTimePurchasers: number
    readonly bounceRate: number | null
  }[]
}

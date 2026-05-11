import type {
  DeviceBreakdownPoint,
  FunnelDailyPoint,
  FunnelStage,
  TopLandingPage,
  TrafficSourcePoint,
} from '@/types/dashboard'

export interface AnalyticsDailyPoint {
  readonly date: string
  readonly sessions: number
  readonly activeUsers: number
  readonly newUsers: number
  readonly firstTimePurchasers: number
  readonly bounceRate: number | null
}

export interface AnalyticsTotals {
  readonly sessions: number
  readonly activeUsers: number
  readonly newUsers: number
  readonly firstTimePurchasers: number
  readonly bounceRate: number | null
}

export interface AnalyticsBreakdowns {
  readonly trafficSources: readonly TrafficSourcePoint[]
  readonly devices: readonly DeviceBreakdownPoint[]
  readonly topLandingPages: readonly TopLandingPage[]
  readonly funnel: readonly FunnelStage[]
  readonly funnelByDay: readonly FunnelDailyPoint[]
}

export interface AnalyticsRangeResult {
  readonly totals: AnalyticsTotals
  readonly byDay: readonly AnalyticsDailyPoint[]
  readonly breakdowns: AnalyticsBreakdowns
}

export interface ReportRow {
  readonly dimensionValues?: readonly { readonly value?: string | null }[] | null
  readonly metricValues?: readonly { readonly value?: string | null }[] | null
}

interface CountryFilterBody {
  fieldName: string
  stringFilter: { matchType: 'EXACT'; value: string }
}

interface EventFilterBody {
  fieldName: string
  inListFilter: { values: string[] }
}

export interface FilterExpression {
  filter?: CountryFilterBody | EventFilterBody
  andGroup?: { expressions: FilterExpression[] }
}

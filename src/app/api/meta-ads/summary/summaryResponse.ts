import {
  computeKpiDelta,
  sumKpis,
  type KpiDelta,
  type AccountSummary,
  type AdLeaderboardEntry,
  type DailyPoint,
  type TopCriteria,
} from '@/lib/meta/aggregate'

export interface SummaryResponse {
  readonly kpis: KpiDelta
  readonly byDay: readonly DailyPoint[]
  readonly byAccount: readonly AccountSummary[]
  readonly topAll: readonly AdLeaderboardEntry[]
  readonly topVideos: readonly AdLeaderboardEntry[]
  readonly topImages: readonly AdLeaderboardEntry[]
  readonly underperformers: readonly AdLeaderboardEntry[]
  readonly accountsMissingAds: readonly string[]
  readonly criteria: TopCriteria
  readonly fetchedAt: number
}

export function emptyResponse(criteria: TopCriteria): SummaryResponse {
  const empty = sumKpis([])
  return {
    kpis: computeKpiDelta(empty, empty),
    byDay: [],
    byAccount: [],
    topAll: [],
    topVideos: [],
    topImages: [],
    underperformers: [],
    accountsMissingAds: [],
    criteria,
    fetchedAt: Date.now(),
  }
}

import { computeKpiDelta, sumKpis, type KpiDelta,
  AccountSummary,
  AdLeaderboardEntry,
  DailyPoint,
  TopCriteria } from '@/lib/meta/aggregate'

const CACHE_MAX_AGE_SECONDS = 3600
const CACHE_STALE_WHILE_REVALIDATE_SECONDS = 600

export interface SummaryResponse {
  readonly kpis: KpiDelta
  readonly byDay: readonly DailyPoint[]
  readonly byAccount: readonly AccountSummary[]
  readonly topAll: readonly AdLeaderboardEntry[]
  readonly topVideos: readonly AdLeaderboardEntry[]
  readonly topImages: readonly AdLeaderboardEntry[]
  readonly underperformers: readonly AdLeaderboardEntry[]
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
    criteria,
    fetchedAt: Date.now(),
  }
}

export function edgeCacheHeaders(): Record<string, string> {
  return {
    'Cache-Control': `s-maxage=${CACHE_MAX_AGE_SECONDS}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE_SECONDS}`,
  }
}

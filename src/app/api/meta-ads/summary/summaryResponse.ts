import {
  computeKpiDelta,
  sumKpis,
  type KpiDelta,
  type AccountSummary,
  type AdLeaderboardEntry,
  type DailyPoint,
  type TopCriteria,
} from '@/lib/meta/aggregate'

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

export function edgeCacheHeaders(): Record<string, string> {
  return {
    'Cache-Control': `s-maxage=${CACHE_MAX_AGE_SECONDS}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE_SECONDS}`,
  }
}

// A partial summary must not sit in the edge cache for an hour — the next load
// should go back to Meta and try the missing accounts again.
export function summaryCacheHeaders(response: SummaryResponse): Record<string, string> {
  return response.accountsMissingAds.length > 0 ? { 'Cache-Control': 'no-store' } : edgeCacheHeaders()
}

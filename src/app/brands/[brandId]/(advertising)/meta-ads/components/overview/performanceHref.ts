import type { BrandId } from '@/types'
import type { DateRangeSelection } from '@/lib/meta/dateRange'
import { ALL_MARKETS, type MarketSelection } from '@/lib/markets'

export type LeaderboardSlice =
  | 'top-all'
  | 'top-video'
  | 'top-image'
  | 'winners'
  | 'underperformers'

export function buildPerformanceHref(
  brandId: BrandId,
  dateSelection: DateRangeSelection,
  market: MarketSelection,
  slice: LeaderboardSlice,
): string {
  const params = new URLSearchParams({ slice })
  if (dateSelection.kind === 'preset') {
    params.set('datePreset', dateSelection.preset)
  } else {
    params.set('from', dateSelection.range.from)
    params.set('to', dateSelection.range.to)
  }
  if (market !== ALL_MARKETS) {
    params.set('market', market)
  }
  return `/brands/${brandId}/meta-ads/performance?${params.toString()}`
}

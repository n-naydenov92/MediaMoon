import type { BrandId } from '@/config/brands'
import type { Market } from '@/types'
import type { DateRangeSelection } from '@/lib/meta/dateRange'
import { ALL_MARKETS } from '@/lib/markets'

export type LeaderboardSlice =
  | 'top-all'
  | 'top-video'
  | 'top-image'
  | 'winners'
  | 'underperformers'

export function buildPerformanceHref(
  brandId: BrandId,
  dateSelection: DateRangeSelection,
  market: Market | typeof ALL_MARKETS,
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

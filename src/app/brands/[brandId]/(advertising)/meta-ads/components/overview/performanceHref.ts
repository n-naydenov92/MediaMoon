import type { BrandId } from '@/config/brands'
import type { Market } from '@/types'
import type { DatePreset } from '@/lib/meta/dateRange'
import { ALL_MARKETS } from '@/lib/markets'

export type LeaderboardSlice = 'top-all' | 'top-video' | 'top-image' | 'underperformers'

export function buildPerformanceHref(
  brandId: BrandId,
  datePreset: DatePreset,
  market: Market | typeof ALL_MARKETS,
  slice: LeaderboardSlice,
): string {
  const params = new URLSearchParams({ datePreset, slice })
  if (market !== ALL_MARKETS) {
    params.set('market', market)
  }
  return `/brands/${brandId}/meta-ads/performance?${params.toString()}`
}

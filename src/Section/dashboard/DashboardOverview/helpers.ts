import type { BrandId } from '@/config/brands'
import { ALL_MARKETS, type MarketSelection } from '@/lib/markets'
import { parseDateRangeFromQuery, type DateRangeSelection } from '@/lib/meta/dateRange'

export function isSingleDayRange(
  selection: ReturnType<typeof parseDateRangeFromQuery>,
): boolean {
  if (selection.kind === 'preset') {
    return selection.preset === 'today' || selection.preset === 'yesterday'
  }
  return selection.range.from === selection.range.to
}

export function buildDashboardQuery(
  brandId: BrandId,
  dateSelection: DateRangeSelection,
  market: MarketSelection,
): string {
  const params = new URLSearchParams({ brandId })
  if (dateSelection.kind === 'preset') {
    params.set('datePreset', dateSelection.preset)
  } else {
    params.set('from', dateSelection.range.from)
    params.set('to', dateSelection.range.to)
  }
  if (market !== ALL_MARKETS) {
    params.set('market', market)
  }
  return params.toString()
}

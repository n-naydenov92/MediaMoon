import { ALL_MARKETS, type MarketSelection } from '@/lib/markets'
import type { Market } from '@/types'
import type { MarketScopedRef } from './types'

export function accountIdsForMarket(refs: readonly MarketScopedRef[], market: Market): readonly string[] {
  return refs.filter((ref) => ref.marketCode === market).map((ref) => ref.id)
}

// "All markets" is every account the brand maps to one of its markets.
export function accountIdsForSelection(
  refs: readonly MarketScopedRef[],
  selection: MarketSelection,
): readonly string[] {
  const ids = selection === ALL_MARKETS ? refs.map((ref) => ref.id) : accountIdsForMarket(refs, selection)
  return [...new Set(ids)]
}

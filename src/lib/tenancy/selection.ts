import { ALL_MARKETS, type MarketSelection } from '@/lib/markets'
import { normalizeAccountId } from '@/lib/meta/accountId'
import type { MarketCode } from '@/types'
import type { MarketScopedRef, MetaAccountRef } from './types'

// Pure and client-safe: the brand shell hands these refs to the browser, so the
// client imports this file directly, never through the server-only barrel.

export function accountIdsForMarket(refs: readonly MarketScopedRef[], market: MarketCode): readonly string[] {
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

export function findMetaAccount(refs: readonly MetaAccountRef[], accountId: string): MetaAccountRef | null {
  const id = normalizeAccountId(accountId)
  return refs.find((ref) => ref.id === id) ?? null
}

// Two ad accounts share a connection when the same token reaches both. That is the
// boundary for reusing a library video's id: referenceable there, never downloadable.
export function shareMetaConnection(refs: readonly MetaAccountRef[], a: string, b: string): boolean {
  const connectionId = findMetaAccount(refs, a)?.connectionId ?? null
  return connectionId !== null && connectionId === findMetaAccount(refs, b)?.connectionId
}

import type { MarketSelection } from '@/lib/markets'

export const MARKET_LABELS: Readonly<Record<MarketSelection, string>> = {
  ALL: 'All markets',
  BG: 'Bulgaria',
  ES: 'Spain',
  WORLD: 'Worldwide',
}

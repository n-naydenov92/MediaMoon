import { ALL_MARKETS, type MarketSelection } from '@/lib/markets'
import type { MarketNames } from '@/types'

export const ALL_MARKETS_LABEL = 'All markets'

export function marketLabel(selection: MarketSelection, names: MarketNames): string {
  if (selection === ALL_MARKETS) {
    return ALL_MARKETS_LABEL
  }
  return names[selection] ?? selection
}

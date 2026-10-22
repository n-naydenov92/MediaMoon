import type { MarketCode } from '@/types'

export const ALL_MARKETS = 'ALL'

// Every market of the brand, or one of them. Market codes are data, so at compile
// time this is a plain string; ALL_MARKETS is reserved and never a market code.
export type MarketSelection = typeof ALL_MARKETS | MarketCode

export const MARKET_PARAM = 'market' as const

export function parseMarketSelection(
  raw: string | string[] | undefined,
  allowed: readonly MarketCode[],
): MarketSelection {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (value !== undefined && allowed.includes(value)) {
    return value
  }
  return ALL_MARKETS
}

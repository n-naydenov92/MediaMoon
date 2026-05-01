import type { Market } from '@/types'

export const MARKETS = ['BG', 'ES', 'WORLD'] as const satisfies readonly Market[]

export type MarketSelection = 'ALL' | Market

export const ALL_MARKETS = 'ALL' as const satisfies MarketSelection

export const MARKET_PARAM = 'market' as const

export function isValidMarket(value: unknown): value is Market {
  return typeof value === 'string' && (MARKETS as readonly string[]).includes(value)
}

export function parseMarketSelection(
  raw: string | string[] | undefined,
  allowed: readonly Market[],
): MarketSelection {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (value === ALL_MARKETS) {
    return ALL_MARKETS
  }
  if (isValidMarket(value) && allowed.includes(value)) {
    return value
  }
  return ALL_MARKETS
}

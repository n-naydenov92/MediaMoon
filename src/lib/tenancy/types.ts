import type { BrandConfig, BrandId, MarketCode, MarketNames } from '@/types'

export type Brand = BrandConfig & { readonly id: BrandId }

// An ad account (Meta) or customer (Google Ads) and the market it serves.
export interface MarketScopedRef {
  readonly id: string
  readonly marketCode: MarketCode
}

export interface MetaAccountRef extends MarketScopedRef {
  // The Meta connection (a Business Manager today) whose token reaches the account.
  readonly connectionId: string | null
}

export interface BrandContext {
  readonly brand: Brand
  readonly marketNames: MarketNames
  readonly metaAccounts: readonly MetaAccountRef[]
  readonly googleAdsCustomers: readonly MarketScopedRef[]
}

// Server-only: carries a token, so it never goes into a client payload.
export interface MetaConnection {
  readonly id: string
  readonly label: string
  readonly token: string
  readonly accountIds: readonly string[]
}

export type MetaAccountTokenLookup =
  | { readonly status: 'found'; readonly token: string; readonly brandId: BrandId }
  | { readonly status: 'unknown-account' }
  | { readonly status: 'no-token' }

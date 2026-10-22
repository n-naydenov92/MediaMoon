import type { BrandId } from '@/config/brands'
import type { BrandConfig, Market } from '@/types'

export type Brand = BrandConfig & { readonly id: BrandId }

export interface MetaAccountRef {
  readonly id: string
  readonly marketCode: Market
  // The Meta connection (a Business Manager today) whose token reaches the account.
  readonly connectionId: string | null
}

export interface BrandContext {
  readonly brand: Brand
  readonly metaAccounts: readonly MetaAccountRef[]
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

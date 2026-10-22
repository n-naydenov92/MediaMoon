import 'server-only'
import { BRAND_MARKET_AD_ACCOUNTS } from '@/config/adAccounts'
import { getAnalyticsProviderEntry, type AnalyticsProviderEntry } from '@/config/analyticsProviders'
import { BRAND_REGISTRY, findBrandById } from '@/config/brands'
import { getCommerceProviderEntry, type CommerceProviderEntry } from '@/config/commerceProviders'
import { BRAND_MARKET_GOOGLE_ADS_CUSTOMERS } from '@/config/googleAdsAccounts'
import { getKlaviyoProviderEntry, type KlaviyoProviderEntry } from '@/config/klaviyoProviders'
import { MARKET_NAMES } from '@/config/markets'
import {
  BUSINESS_MANAGERS,
  getBusinessManagerForAccount,
  type MetaBusinessManager,
} from '@/config/metaBusinessManagers'
import type { MarketCode, MarketNames } from '@/types'
import type { Brand, MarketScopedRef, MetaAccountRef } from '../types'

export type MetaConnectionRecord = MetaBusinessManager

type IdsByMarket = Partial<Record<MarketCode, readonly string[]>>

const NO_IDS: IdsByMarket = {}

export function readBrands(): readonly Brand[] {
  return BRAND_REGISTRY
}

export function readBrand(brandId: string): Brand | null {
  return findBrandById(brandId)
}

export function readMarketNames(brand: Brand): MarketNames {
  return Object.fromEntries(brand.markets.map((code) => [code, MARKET_NAMES[code] ?? code]))
}

export function readMetaAccounts(brand: Brand): readonly MetaAccountRef[] {
  return toMarketScopedRefs(BRAND_MARKET_AD_ACCOUNTS[brand.id] ?? NO_IDS).map((ref) => ({
    ...ref,
    connectionId: getBusinessManagerForAccount(ref.id)?.id ?? null,
  }))
}

export function readGoogleAdsCustomers(brand: Brand): readonly MarketScopedRef[] {
  return toMarketScopedRefs(BRAND_MARKET_GOOGLE_ADS_CUSTOMERS[brand.id] ?? NO_IDS)
}

export function readMetaConnections(brandId: string): readonly MetaConnectionRecord[] {
  return BUSINESS_MANAGERS.filter((bm) => bm.brandId === brandId)
}

export function readMetaConnectionForAccount(accountId: string): MetaConnectionRecord | null {
  return getBusinessManagerForAccount(accountId)
}

export function readCommerceProvider(brandId: string): CommerceProviderEntry | null {
  return getCommerceProviderEntry(brandId)
}

export function readAnalyticsProvider(brandId: string): AnalyticsProviderEntry | null {
  return getAnalyticsProviderEntry(brandId)
}

export function readKlaviyoProvider(brandId: string): KlaviyoProviderEntry | null {
  return getKlaviyoProviderEntry(brandId)
}

function toMarketScopedRefs(byMarket: IdsByMarket): readonly MarketScopedRef[] {
  return Object.entries(byMarket).flatMap(([marketCode, ids]) =>
    (ids ?? []).map((id) => ({ id, marketCode })))
}

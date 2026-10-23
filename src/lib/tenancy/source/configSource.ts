import 'server-only'
import { BRAND_MARKET_AD_ACCOUNTS } from '@/config/adAccounts'
import { getAnalyticsProviderEntry } from '@/config/analyticsProviders'
import { BRAND_REGISTRY, findBrandById } from '@/config/brands'
import { getCommerceProviderEntry } from '@/config/commerceProviders'
import { BRAND_MARKET_GOOGLE_ADS_CUSTOMERS } from '@/config/googleAdsAccounts'
import { getKlaviyoProviderEntry } from '@/config/klaviyoProviders'
import { MARKET_NAMES } from '@/config/markets'
import { BUSINESS_MANAGERS, getBusinessManagerForAccount } from '@/config/metaBusinessManagers'
import type { MarketCode } from '@/types'
import type { Brand, BrandContext, MarketScopedRef } from '../types'
import type { TenancySource } from './types'

type IdsByMarket = Partial<Record<MarketCode, readonly string[]>>

const NO_IDS: IdsByMarket = {}

// The config files as a tenancy source: what the app ran on before the database.
export const configSource: TenancySource = {
  readBrands: async () => BRAND_REGISTRY,
  readBrandContext: async (brandId) => {
    const brand = findBrandById(brandId)
    return brand ? toBrandContext(brand) : null
  },
  readMetaConnections: async (brandId) => BUSINESS_MANAGERS.filter((bm) => bm.brandId === brandId),
  readMetaConnectionForAccount: async (accountId) => getBusinessManagerForAccount(accountId),
  readCommerceProvider: async (brandId) => getCommerceProviderEntry(brandId),
  readAnalyticsProvider: async (brandId) => getAnalyticsProviderEntry(brandId),
  readKlaviyoProvider: async (brandId) => getKlaviyoProviderEntry(brandId),
}

function toBrandContext(brand: Brand): BrandContext {
  return {
    brand,
    marketNames: Object.fromEntries(brand.markets.map((code) => [code, MARKET_NAMES[code] ?? code])),
    metaAccounts: toMarketScopedRefs(BRAND_MARKET_AD_ACCOUNTS[brand.id] ?? NO_IDS).map((ref) => ({
      ...ref,
      connectionId: getBusinessManagerForAccount(ref.id)?.id ?? null,
    })),
    googleAdsCustomers: toMarketScopedRefs(BRAND_MARKET_GOOGLE_ADS_CUSTOMERS[brand.id] ?? NO_IDS),
  }
}

function toMarketScopedRefs(byMarket: IdsByMarket): readonly MarketScopedRef[] {
  return Object.entries(byMarket).flatMap(([marketCode, ids]) =>
    (ids ?? []).map((id) => ({ id, marketCode })))
}

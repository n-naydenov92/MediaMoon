import type { Market } from '@/types'
import type { BrandId } from './brands'

type BrandMarketCustomers = Partial<Record<Market, readonly string[]>>

// 10-digit Google Ads customer IDs (no dashes), keyed per brand and market.
// All three brand accounts sit under manager account 9240668043 (GOOGLE_ADS_LOGIN_CUSTOMER_ID).
export const BRAND_MARKET_GOOGLE_ADS_CUSTOMERS: Record<BrandId, BrandMarketCustomers> = {
  stoitchkov: { BG: ['1666622745'] },
  thegreenbear: { BG: ['5547703003'] },
  sapphire: { BG: ['7797859280'] },
  bubullincas: {},
  monitrade: {},
}

export interface GoogleAdsCredentials {
  readonly developerToken: string
  readonly clientId: string
  readonly clientSecret: string
  readonly refreshToken: string
  readonly loginCustomerId: string
}

export function getGoogleAdsCustomerIds(brandId: BrandId, market: Market): readonly string[] {
  return BRAND_MARKET_GOOGLE_ADS_CUSTOMERS[brandId]?.[market] ?? []
}

export function getGoogleAdsCredentials(): GoogleAdsCredentials | null {
  const developerToken = readEnv('GOOGLE_ADS_DEVELOPER_TOKEN')
  const clientId = readEnv('GOOGLE_ADS_CLIENT_ID')
  const clientSecret = readEnv('GOOGLE_ADS_CLIENT_SECRET')
  const refreshToken = readEnv('GOOGLE_ADS_REFRESH_TOKEN')
  const loginCustomerId = readEnv('GOOGLE_ADS_LOGIN_CUSTOMER_ID')
  if (!developerToken || !clientId || !clientSecret || !refreshToken || !loginCustomerId) {
    return null
  }
  return { developerToken, clientId, clientSecret, refreshToken, loginCustomerId }
}

function readEnv(envVar: string): string | null {
  const value = process.env[envVar]
  return value && value.length > 0 ? value : null
}

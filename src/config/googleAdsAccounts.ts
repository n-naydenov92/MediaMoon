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

/**
 * Resolved credentials and settings the gateways receive for one brand's
 * integration. The tenancy layer builds them; gateways never look them up.
 */

import type { BrandId } from '@/types'

export type KlaviyoIntegrationName = 'WooCommerce' | 'Shopify'

export interface KlaviyoProviderConfig {
  readonly brandId: BrandId
  readonly apiKey: string
  readonly integrationName: KlaviyoIntegrationName
}

export interface AnalyticsProviderConfig {
  readonly kind: 'ga4'
  readonly propertyId: string
  readonly timezone: string
}

export interface GoogleAdsCredentials {
  readonly developerToken: string
  readonly clientId: string
  readonly clientSecret: string
  readonly refreshToken: string
  readonly loginCustomerId: string
}

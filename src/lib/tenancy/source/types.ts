import type { KlaviyoIntegrationName } from '@/config/klaviyoProviders'
import type { Brand, BrandContext } from '../types'

// What the tenancy layer reads, wherever it lives (config files or the database).
// Records name the env vars that hold secrets; the layer resolves the values, so a
// source never handles a secret.
export interface TenancySource {
  readBrands(): Promise<readonly Brand[]>
  readBrandContext(brandId: string): Promise<BrandContext | null>
  readMetaConnections(brandId: string): Promise<readonly MetaConnectionRecord[]>
  readMetaConnectionForAccount(accountId: string): Promise<MetaConnectionRecord | null>
  readCommerceProvider(brandId: string): Promise<CommerceRecord | null>
  readAnalyticsProvider(brandId: string): Promise<AnalyticsRecord | null>
  readKlaviyoProvider(brandId: string): Promise<KlaviyoRecord | null>
}

export interface MetaConnectionRecord {
  readonly id: string
  readonly label: string
  readonly brandId: string
  readonly tokenEnvVar: string | null
  readonly accountIds: readonly string[]
}

export interface CommerceRecordBase {
  readonly brandId: string
  readonly urlEnvVar: string
  readonly currency: string
  readonly timezone: string
}

export interface WooCommerceRecord extends CommerceRecordBase {
  readonly kind: 'woocommerce'
  readonly keyEnvVar: string
  readonly secretEnvVar: string
}

export interface ShopifyRecord extends CommerceRecordBase {
  readonly kind: 'shopify'
  readonly clientIdEnvVar: string
  readonly clientSecretEnvVar: string
}

export type CommerceRecord = WooCommerceRecord | ShopifyRecord

export interface AnalyticsRecord {
  readonly brandId: string
  readonly kind: 'ga4'
  readonly propertyEnvVar: string
  readonly timezone: string
}

export interface KlaviyoRecord {
  readonly brandId: string
  readonly apiKeyEnvVar: string
  readonly integrationName: KlaviyoIntegrationName
}

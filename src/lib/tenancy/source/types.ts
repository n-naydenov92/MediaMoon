import type { KlaviyoIntegrationName } from '@/types/integrations'

// What the database holds for a connection. Records name the env vars that hold
// secrets; the credential resolvers read the values, so the source never handles
// a secret.

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

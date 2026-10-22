import type { BrandId } from './brands'

export type KlaviyoIntegrationName = 'WooCommerce' | 'Shopify'

export interface KlaviyoProviderEntry {
  readonly brandId: BrandId
  readonly apiKeyEnvVar: string
  readonly integrationName: KlaviyoIntegrationName
}

export interface KlaviyoProviderConfig {
  readonly brandId: BrandId
  readonly apiKey: string
  readonly integrationName: KlaviyoIntegrationName
}

const KLAVIYO_PROVIDERS: readonly KlaviyoProviderEntry[] = [
  {
    brandId: 'thegreenbear',
    apiKeyEnvVar: 'KLAVIYO_API_KEY_THEGREENBEAR',
    integrationName: 'WooCommerce',
  },
  {
    brandId: 'sapphire',
    apiKeyEnvVar: 'KLAVIYO_API_KEY_SAPPHIRE',
    integrationName: 'WooCommerce',
  },
  {
    brandId: 'stoitchkov',
    apiKeyEnvVar: 'KLAVIYO_API_KEY_STOITCHKOV',
    integrationName: 'Shopify',
  },
]

export function getKlaviyoProviderEntry(brandId: string): KlaviyoProviderEntry | null {
  return KLAVIYO_PROVIDERS.find((p) => p.brandId === brandId) ?? null
}

import type { BrandId } from './brands'

export type KlaviyoIntegrationName = 'WooCommerce' | 'Shopify'

interface KlaviyoProviderEntry {
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

export function resolveKlaviyoProvider(brandId: BrandId): KlaviyoProviderConfig | null {
  const entry = KLAVIYO_PROVIDERS.find((p) => p.brandId === brandId)
  if (!entry) {
    return null
  }
  const apiKey = readEnv(entry.apiKeyEnvVar)
  if (!apiKey) {
    return null
  }
  return {
    brandId: entry.brandId,
    apiKey,
    integrationName: entry.integrationName,
  }
}

function readEnv(envVar: string): string | null {
  const value = process.env[envVar]
  return value && value.length > 0 ? value : null
}

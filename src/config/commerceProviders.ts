import type { BrandId } from './brands'

interface CommerceProviderEntryBase {
  readonly brandId: BrandId
  readonly urlEnvVar: string
  readonly currency: string
  readonly timezone: string
}

interface WooCommerceProviderEntry extends CommerceProviderEntryBase {
  readonly kind: 'woocommerce'
  readonly keyEnvVar: string
  readonly secretEnvVar: string
}

interface ShopifyProviderEntry extends CommerceProviderEntryBase {
  readonly kind: 'shopify'
  readonly clientIdEnvVar: string
  readonly clientSecretEnvVar: string
}

export type CommerceProviderEntry = WooCommerceProviderEntry | ShopifyProviderEntry

export const COMMERCE_PROVIDERS: readonly CommerceProviderEntry[] = [
  {
    brandId: 'sapphire',
    kind: 'woocommerce',
    urlEnvVar: 'WOO_URL_SAPPHIRE',
    keyEnvVar: 'WOO_KEY_SAPPHIRE',
    secretEnvVar: 'WOO_SECRET_SAPPHIRE',
    currency: 'EUR',
    timezone: 'Europe/Sofia',
  },
  {
    brandId: 'thegreenbear',
    kind: 'woocommerce',
    urlEnvVar: 'WOO_URL_THEGREENBEAR',
    keyEnvVar: 'WOO_KEY_THEGREENBEAR',
    secretEnvVar: 'WOO_SECRET_THEGREENBEAR',
    currency: 'EUR',
    timezone: 'Europe/Sofia',
  },
  {
    brandId: 'stoitchkov',
    kind: 'shopify',
    urlEnvVar: 'SHOPIFY_URL_STOITCHKOV',
    clientIdEnvVar: 'SHOPIFY_CLIENT_ID_STOITCHKOV',
    clientSecretEnvVar: 'SHOPIFY_CLIENT_SECRET_STOITCHKOV',
    currency: 'EUR',
    timezone: 'Europe/Sofia',
  },
]

export function getCommerceProviderEntry(brandId: BrandId): CommerceProviderEntry | null {
  return COMMERCE_PROVIDERS.find((p) => p.brandId === brandId) ?? null
}

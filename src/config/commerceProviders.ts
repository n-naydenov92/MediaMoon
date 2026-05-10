import type { BrandId } from './brands'
import type { CommerceProviderKind } from '@/types/commerce'

interface CommerceProviderEntry {
  readonly brandId: BrandId
  readonly kind: CommerceProviderKind
  readonly urlEnvVar: string
  readonly keyEnvVar: string
  readonly secretEnvVar: string
  readonly currency: string
  readonly timezone: string
}

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
]

export function getCommerceProviderEntry(brandId: BrandId): CommerceProviderEntry | null {
  return COMMERCE_PROVIDERS.find((p) => p.brandId === brandId) ?? null
}

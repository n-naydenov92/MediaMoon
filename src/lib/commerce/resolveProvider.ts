import type { BrandId } from '@/config/brands'
import { getCommerceProviderEntry } from '@/config/commerceProviders'
import type { CommerceProviderConfig } from '@/types/commerce'

function readEnv(envVar: string): string | null {
  const value = process.env[envVar]
  return value && value.length > 0 ? value : null
}

export function resolveCommerceProvider(brandId: BrandId): CommerceProviderConfig | null {
  const entry = getCommerceProviderEntry(brandId)
  if (!entry) {
    return null
  }
  const storeUrl = readEnv(entry.urlEnvVar)
  const consumerKey = readEnv(entry.keyEnvVar)
  const consumerSecret = readEnv(entry.secretEnvVar)
  if (!storeUrl || !consumerKey || !consumerSecret) {
    return null
  }
  if (entry.kind === 'woocommerce') {
    return {
      kind: 'woocommerce',
      storeUrl: storeUrl.replace(/\/+$/, ''),
      consumerKey,
      consumerSecret,
      currency: entry.currency,
      timezone: entry.timezone,
    }
  }
  return null
}

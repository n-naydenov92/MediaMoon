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
  const storeUrlRaw = readEnv(entry.urlEnvVar)
  if (!storeUrlRaw) {
    return null
  }
  const storeUrl = storeUrlRaw.replace(/\/+$/, '')

  if (entry.kind === 'woocommerce') {
    const consumerKey = readEnv(entry.keyEnvVar)
    const consumerSecret = readEnv(entry.secretEnvVar)
    if (!consumerKey || !consumerSecret) {
      return null
    }
    return {
      kind: 'woocommerce',
      storeUrl,
      consumerKey,
      consumerSecret,
      currency: entry.currency,
      timezone: entry.timezone,
    }
  }

  if (entry.kind === 'shopify') {
    const accessToken = readEnv(entry.tokenEnvVar)
    if (!accessToken) {
      return null
    }
    return {
      kind: 'shopify',
      storeUrl,
      accessToken,
      currency: entry.currency,
      timezone: entry.timezone,
    }
  }

  const exhaustive: never = entry
  return exhaustive
}

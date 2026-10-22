import 'server-only'
import type { CommerceProviderEntry } from '@/config/commerceProviders'
import type { CommerceProviderConfig } from '@/types/commerce'
import { readCommerceProvider } from '../source/configSource'
import { readSecret } from './secrets'

type WooEntry = Extract<CommerceProviderEntry, { kind: 'woocommerce' }>
type ShopifyEntry = Extract<CommerceProviderEntry, { kind: 'shopify' }>

export async function resolveCommerceConfig(brandId: string): Promise<CommerceProviderConfig | null> {
  const entry = readCommerceProvider(brandId)
  const storeUrlRaw = entry ? readSecret(entry.urlEnvVar) : null
  if (!entry || !storeUrlRaw) {
    return null
  }
  const storeUrl = storeUrlRaw.replace(/\/+$/, '')
  return entry.kind === 'woocommerce' ? toWooConfig(entry, storeUrl) : toShopifyConfig(entry, storeUrl)
}

function toWooConfig(entry: WooEntry, storeUrl: string): CommerceProviderConfig | null {
  const consumerKey = readSecret(entry.keyEnvVar)
  const consumerSecret = readSecret(entry.secretEnvVar)
  if (!consumerKey || !consumerSecret) {
    return null
  }
  const { currency, timezone } = entry
  return { kind: 'woocommerce', storeUrl, consumerKey, consumerSecret, currency, timezone }
}

function toShopifyConfig(entry: ShopifyEntry, storeUrl: string): CommerceProviderConfig | null {
  const clientId = readSecret(entry.clientIdEnvVar)
  const clientSecret = readSecret(entry.clientSecretEnvVar)
  if (!clientId || !clientSecret) {
    return null
  }
  const { currency, timezone } = entry
  return { kind: 'shopify', storeUrl, clientId, clientSecret, currency, timezone }
}
